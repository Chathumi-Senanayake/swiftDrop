// Who is logged in. Any component can call useAuth() to read the user or log in / out.
import { createContext, useContext, useState } from 'react';
import { api, clearLogin, getStoredUser, getToken, storeLogin } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  async function login(email, password) {
    const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    storeLogin(token, user);
    setUser(user);
    return user;
  }

  // idToken: from Firebase after the Google pop-up (see firebase.js)
  async function loginWithGoogle(idToken) {
    const { token, user } = await api('/auth/google', { method: 'POST', body: { idToken } });
    storeLogin(token, user);
    setUser(user);
    return user;
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {}
    clearLogin();
    setUser(null);
  }

  // After the profile is edited
  function updateUser(next) {
    storeLogin(getToken(), next);
    setUser(next);
  }

  const isAdmin = user?.role === 'admin';
  return <AuthContext.Provider value={{ user, isAdmin, login, loginWithGoogle, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
