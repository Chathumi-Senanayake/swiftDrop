import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthSide from '../components/AuthSide';
import GoogleButton from '../components/GoogleButton';
import Logo from '../components/Logo';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/auth/register', { method: 'POST', body: form });
      await login(form.email, form.password); // log straight in after signing up
      navigate(params.get('next') || '/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const field = (name) => ({ name, id: 'r-' + name, value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

  return (
    <main className="auth">
      <AuthSide />
      <div className="auth-main">
        <form className="auth-card" onSubmit={submit}>
          <Link to="/" className="logo auth-card-logo" aria-label="SwiftDrop home">
            <Logo size={40} />
          </Link>
          <h1>Create your account</h1>
          <p className="sub">Limited stock. No restocks. Be first.</p>
          {/* Google accounts add their phone and address later, before their first purchase */}
          <GoogleButton label="Sign up with Google" onDone={() => navigate(params.get('next') || '/')} onError={setError} />
          <div className="form-group">
            <label htmlFor="r-name">Full name</label>
            <input required autoFocus autoComplete="name" {...field('name')} />
          </div>
          <div className="form-group">
            <label htmlFor="r-email">Email</label>
            <input type="email" required autoComplete="email" {...field('email')} />
          </div>
          <div className="form-group">
            <label htmlFor="r-phone">Phone number</label>
            <input type="tel" required autoComplete="tel" placeholder="077 123 4567" {...field('phone')} />
          </div>
          <div className="form-group">
            <label htmlFor="r-address">Delivery address</label>
            <textarea rows={2} required maxLength={300} autoComplete="street-address" placeholder="House no., street, city" {...field('address')} />
          </div>
          <div className="form-group">
            <label htmlFor="r-password">Password <span className="muted">(min 6 characters)</span></label>
            <input type="password" minLength={6} required autoComplete="new-password" {...field('password')} />
          </div>
          <div className="form-error">{error}</div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <p className="muted small" style={{ marginTop: 18, textAlign: 'center' }}>
            Already have an account? <Link to="/login" className="text-link">Log in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
