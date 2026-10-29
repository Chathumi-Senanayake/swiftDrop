// "Get sale alerts" email box at the bottom of the home page
import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from './Icon';

export default function SaleAlerts() {
  const { user } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState(user?.email || '');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/subscribe', { method: 'POST', body: { email } });
      setDone(true);
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusy(false);
  }

  return (
    <section className="sale-alerts">
      <div className="sale-alerts-bell" aria-hidden="true">🔔</div>
      <div className="sale-alerts-text">
        <h2>Never miss a drop</h2>
        <p>Get an email when a new flash sale is about to open. No spam – just the deals.</p>
      </div>
      {done ? (
        <div className="sale-alerts-done"><Icon name="check" size={20} strokeWidth={3} /> You're on the list!</div>
      ) : (
        <form className="sale-alerts-form" onSubmit={submit}>
          <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Notify me'}</button>
        </form>
      )}
    </section>
  );
}
