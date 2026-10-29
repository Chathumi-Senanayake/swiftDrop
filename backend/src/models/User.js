const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '' }, // empty for people who only sign in with Google
    googleId: { type: String, default: undefined, index: { unique: true, sparse: true } }, // Firebase uid of their Google sign-in
    phone: { type: String, default: '', trim: true }, // needed for delivery
    address: { type: String, default: '', trim: true }, // delivery address
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    active: { type: Boolean, default: true }, // false = deactivated by an admin
  },
  { timestamps: true }
);

// Never send the password hash to the browser (only whether there is one, so the profile page knows
// if a Google-only user is setting their first password)
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.hasPassword = Boolean(ret.passwordHash);
    delete ret.passwordHash;
    delete ret.googleId;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
