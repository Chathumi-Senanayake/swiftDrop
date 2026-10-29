// Business logic for accounts: register, login, logout, passwords, profile.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const config = require('../config');

const SESSION_HOURS = 24;

function validateEmail(email) {
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new AppError(400, 'Please enter a valid email address.', 'VALIDATION');
}

// Sri Lankan or international number: 9–15 digits, may start with + and contain spaces / dashes
function cleanPhone(phone) {
  phone = String(phone || '').trim();
  if (!/^\+?[\d\s-]{9,20}$/.test(phone) || phone.replace(/\D/g, '').length < 9 || phone.replace(/\D/g, '').length > 15) {
    throw new AppError(400, 'Please enter a valid phone number, e.g. 077 123 4567.', 'VALIDATION');
  }
  return phone;
}

function cleanAddress(address) {
  address = String(address || '').trim();
  if (address.length < 10) throw new AppError(400, 'Please enter your full delivery address (house no., street, city).', 'VALIDATION');
  if (address.length > 300) throw new AppError(400, 'Address must be 300 characters or less.', 'VALIDATION');
  return address;
}

function validatePassword(password) {
  if (!password || password.length < 6) throw new AppError(400, 'Password must be at least 6 characters.', 'VALIDATION');
}

// Turn a session row into a signed token the browser keeps
function signToken(session, user) {
  return jwt.sign({ sid: session._id.toString(), uid: user._id.toString(), role: user.role }, config.jwtSecret, {
    expiresIn: `${SESSION_HOURS}h`,
  });
}

async function createSession(user) {
  const session = await Session.create({
    userId: user._id,
    expiresAt: new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000),
  });
  return signToken(session, user);
}

async function register({ name, email, password, phone, address }) {
  name = (name || '').trim();
  email = (email || '').trim().toLowerCase();
  if (!name) throw new AppError(400, 'Please enter your name.', 'VALIDATION');
  validateEmail(email);
  phone = cleanPhone(phone);
  address = cleanAddress(address);
  validatePassword(password);

  if (await User.exists({ email })) throw new AppError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    // Public registration can ONLY create customers. Admins come from the seed script or another admin.
    return await User.create({ name, email, phone, address, passwordHash, role: 'customer' });
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
    throw err;
  }
}

async function login({ email, password }) {
  const user = await User.findOne({ email: (email || '').trim().toLowerCase() });
  const ok = user && user.passwordHash && (await bcrypt.compare(password || '', user.passwordHash));
  if (user && !user.passwordHash && user.googleId) {
    throw new AppError(401, 'This account uses Google sign-in. Please press "Continue with Google".', 'USE_GOOGLE');
  }
  if (!ok) throw new AppError(401, 'Incorrect email or password.', 'BAD_LOGIN');
  if (!user.active) throw new AppError(403, 'This account has been deactivated. Please contact support.', 'DEACTIVATED');

  const token = await createSession(user);
  return { token, user };
}

// "Continue with Google": the browser signs in with Firebase and sends us Firebase's ID token.
// We check the token's signature with Google's public keys, then log in (or create) the matching account.
let firebaseAuth = null;
function getFirebaseAuth() {
  if (!config.firebaseProjectId) throw new AppError(400, 'Google sign-in is not available right now.', 'METHOD_UNAVAILABLE');
  if (!firebaseAuth) {
    const { initializeApp, getApps } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const app = getApps()[0] || initializeApp({ projectId: config.firebaseProjectId });
    firebaseAuth = getAuth(app);
  }
  return firebaseAuth;
}

async function loginWithGoogle({ idToken }) {
  if (!idToken || typeof idToken !== 'string') throw new AppError(400, 'Google sign-in failed. Please try again.', 'VALIDATION');
  let claims;
  try {
    claims = await getFirebaseAuth().verifyIdToken(idToken);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Google sign-in failed or expired. Please try again.', 'BAD_LOGIN');
  }
  if (claims.firebase?.sign_in_provider !== 'google.com') throw new AppError(401, 'Please sign in with Google.', 'BAD_LOGIN');
  // Only a verified address may be linked to an existing account, otherwise anyone could take it over
  const email = (claims.email || '').toLowerCase();
  if (!email || !claims.email_verified) throw new AppError(401, 'Your Google account has no verified email address.', 'BAD_LOGIN');

  let user = await User.findOne({ googleId: claims.uid });
  if (!user) {
    // Same email as an existing account: link Google to it. Otherwise a new customer account.
    // Phone and address are asked for later (the profile page / before the first purchase).
    user = await User.findOneAndUpdate(
      { email, googleId: { $exists: false } },
      { $set: { googleId: claims.uid }, $setOnInsert: { name: claims.name || email.split('@')[0], role: 'customer' } },
      { upsert: true, new: true }
    ).catch((err) => {
      if (err.code === 11000) throw new AppError(409, 'This email is already linked to a different Google account.', 'EMAIL_TAKEN');
      throw err;
    });
  }
  if (!user.active) throw new AppError(403, 'This account has been deactivated. Please contact support.', 'DEACTIVATED');

  const token = await createSession(user);
  return { token, user };
}

async function logout(sessionId) {
  await Session.deleteOne({ _id: sessionId });
}

// Called on every protected request: checks the signature AND that the session still exists
async function verifyToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError(401, 'Your session has expired. Please log in again.', 'UNAUTHENTICATED');
  }

  const session = await Session.findById(payload.sid).lean();
  if (!session) throw new AppError(401, 'Your session has ended. Please log in again.', 'UNAUTHENTICATED');

  const user = await User.findById(session.userId);
  if (!user) throw new AppError(401, 'Please log in again.', 'UNAUTHENTICATED');
  if (!user.active) throw new AppError(403, 'This account has been deactivated.', 'DEACTIVATED');

  return { user, sessionId: session._id };
}

// Google-only accounts have no password yet: they may set their first one without a current password
async function changePassword(user, { currentPassword, newPassword }) {
  if (user.passwordHash && !(await bcrypt.compare(currentPassword || '', user.passwordHash))) {
    throw new AppError(400, 'Your current password is incorrect.', 'BAD_PASSWORD');
  }
  validatePassword(newPassword);
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
}

// Customers must keep a phone number and address (needed for delivery); for admins they are optional
async function updateProfile(user, { name, phone, address }) {
  name = (name || '').trim();
  if (!name) throw new AppError(400, 'Display name cannot be empty.', 'VALIDATION');
  user.name = name;
  if (user.role === 'customer' || phone) user.phone = cleanPhone(phone);
  if (user.role === 'customer' || address) user.address = cleanAddress(address);
  await user.save();
  return user;
}

module.exports = { register, login, loginWithGoogle, logout, verifyToken, changePassword, updateProfile, signToken };
