// "Continue with Google" through Firebase Authentication.
// The Firebase settings come from frontend/.env (see .env.example). Without them the Google button is hidden.
// Firebase is only downloaded when someone actually presses the button, so it does not slow down the site.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const googleEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

// Opens Google's sign-in pop-up. Returns a Firebase ID token for our server, or null if the pop-up was closed.
export async function googleIdToken() {
  const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);
  const app = getApps()[0] || initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' }); // always let them pick which Google account
  try {
    const { user } = await signInWithPopup(auth, provider);
    const token = await user.getIdToken();
    await signOut(auth); // our own login session takes over from here
    return token;
  } catch (err) {
    if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(err.code)) return null;
    if (err.code === 'auth/popup-blocked') throw new Error('Your browser blocked the Google pop-up. Please allow pop-ups for this site and try again.');
    if (err.code === 'auth/unauthorized-domain') throw new Error('Google sign-in is not allowed on this address yet. Add it under Firebase → Authentication → Settings → Authorized domains.');
    throw new Error('Google sign-in failed. Please try again.');
  }
}
