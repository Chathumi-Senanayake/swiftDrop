import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      const user = await login(form.email, form.password);
      navigate(params.get('next') || (user.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const field = (name) => ({ name, value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

  return (
    <div className="auth-wrap">
      <form className="card card-pad auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          Log in to catch the next drop.
        </p>
        <div className="form-group">
          <label>Email</label>
          <input type="email" required autoFocus {...field('email')} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" required {...field('password')} />
        </div>
        <div className="form-error">{error}</div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          Log in
        </button>
        <p className="muted small" style={{ marginTop: 16, textAlign: 'center' }}>
          No account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
