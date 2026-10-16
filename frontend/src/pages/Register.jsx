import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const field = (name) => ({ name, value: form[name], onChange: (e) => setForm({ ...form, [name]: e.target.value }) });

  return (
    <div className="auth-wrap">
      <form className="card card-pad auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted" style={{ marginBottom: 22 }}>
          Limited stock. No restocks. Be first.
        </p>
        <div className="form-group">
          <label>Display name</label>
          <input required autoFocus {...field('name')} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" required {...field('email')} />
        </div>
        <div className="form-group">
          <label>Phone number</label>
          <input type="tel" required placeholder="077 123 4567" {...field('phone')} />
        </div>
        <div className="form-group">
          <label>Delivery address</label>
          <textarea rows={2} required maxLength={300} placeholder="House no., street, city" {...field('address')} />
        </div>
        <div className="form-group">
          <label>Password (min 6 characters)</label>
          <input type="password" minLength={6} required {...field('password')} />
        </div>
        <div className="form-error">{error}</div>
        <button className="btn btn-primary btn-block" disabled={busy}>
          Sign up
        </button>
        <p className="muted small" style={{ marginTop: 16, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
