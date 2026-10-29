import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthSide from '../components/AuthSide';
import GoogleButton from '../components/GoogleButton';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      done(await login(form.email, form.password));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const field = (name) => ({ name, id: 'l-' + name, value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });
  const done = (user) => navigate(params.get('next') || (user.role === 'admin' ? '/admin' : '/'));

  return (
    <main className="auth">
      <AuthSide />
      <div className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <Link to="/" className="logo auth-card-logo" aria-label="SwiftDrop home">
            <Logo size={40} />
          </Link>
          <h1>Welcome back</h1>
          <p className="sub">Log in to catch the next drop.</p>
          <GoogleButton onDone={done} onError={setError} />
          <div className="form-group">
            <label htmlFor="l-email">Email</label>
            <input type="email" required autoFocus autoComplete="email" {...field('email')} />
          </div>
          <div className="form-group">
            <label htmlFor="l-password">Password</label>
            <input type="password" required autoComplete="current-password" {...field('password')} />
          </div>
          <div className="form-error">{error}</div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
          <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}>
            New to SwiftDrop? <Link to={'/register' + (params.get('next') ? '?next=' + encodeURIComponent(params.get('next')) : '')} className="text-link">Create an account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
