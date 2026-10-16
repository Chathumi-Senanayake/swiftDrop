// Talks to the Express API. Every call returns the JSON body or throws an Error with a friendly message.

// ---------- Login state (saved in the browser) ----------
export function getToken() {
  return localStorage.getItem('token');
}
export function getStoredUser() {
  return JSON.parse(localStorage.getItem('user') || 'null');
}
export function storeLogin(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
export function clearLogin() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// api('/events')                                             -> GET
// api('/auth/login', { method: 'POST', body: {...} })
// api('/admin/events', { method: 'POST', form: formData })   (file uploads)
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (getToken()) headers.Authorization = 'Bearer ' + getToken();
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch('/api' + path, { method, headers, body: form || (body && JSON.stringify(body)) });
  } catch {
    throw new Error('Cannot reach the server. Please check your connection.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && getToken()) {
      clearLogin(); // session ended -> back to login
      window.location.href = '/login';
    }
    const err = new Error(data.error?.message || 'Something went wrong. Please try again.');
    err.code = data.error?.code;
    throw err;
  }
  return data;
}
