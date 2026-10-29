import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';
import { initials } from '../utils';

export default function Profile() {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [details, setDetails] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const hasPassword = user.hasPassword !== false; // false only for accounts made with "Continue with Google"

  // Fetch fresh details from the server in case they changed elsewhere
  useEffect(() => {
    api('/me')
      .then(({ user }) => {
        updateUser(user);
        setDetails({ name: user.name, phone: user.phone || '', address: user.address || '' });
      })
      .catch((err) => toast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const { user } = await api('/me', { method: 'PUT', body: details });
      updateUser(user);
      toast('Profile updated.', 'success');
      if (params.get('complete')) navigate(-1); // came here from a Buy button -> go back to the product
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    try {
      await api('/me/password', { method: 'PUT', body: passwords });
      setPasswords({ currentPassword: '', newPassword: '' });
      toast(hasPassword ? 'Password changed.' : 'Password set. You can now also log in with your email.', 'success');
      if (!hasPassword) updateUser({ ...user, hasPassword: true });
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const detail = (key) => ({ id: 'p-' + key, value: details[key], onChange: (e) => setDetails({ ...details, [key]: e.target.value }) });
  const pw = (key) => ({ id: 'p-' + key, value: passwords[key], onChange: (e) => setPasswords({ ...passwords, [key]: e.target.value }) });

  return (
    <main className="container page">
      <div className="side-layout">
        <aside className="card side-menu">
          <div className="row" style={{ padding: '8px 12px 14px' }}>
            <div className="avatar" style={{ cursor: 'default' }}>{initials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <strong className="small">{user.name}</strong>
              <div className="muted tiny" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
          </div>
          <a href="#profile" className="active"><Icon name="user" size={18} /> Profile</a>
          {!isAdmin && <Link to="/orders"><Icon name="box" size={18} /> My orders</Link>}
          {!isAdmin && <Link to="/cart"><Icon name="cart" size={18} /> Cart</Link>}
          {isAdmin && <Link to="/admin"><Icon name="grid" size={18} /> Admin dashboard</Link>}
          <a href="#password"><Icon name="key" size={18} /> {hasPassword ? 'Change password' : 'Set a password'}</a>
          <hr />
          <button className="danger" onClick={() => logout().then(() => navigate('/login'))}><Icon name="logout" size={18} /> Log out</button>
        </aside>

        <div className="stack" style={{ gap: 20 }}>
          {params.get('complete') && (
            <div className="info-box warn">
              <Icon name="info" size={20} />
              <div><strong>One more step</strong>Add your phone number and delivery address so we can deliver your order.</div>
            </div>
          )}

          <section className="card card-pad" id="profile">
            <h2 style={{ marginBottom: 4 }}>Profile</h2>
            <p className="muted small" style={{ marginBottom: 20 }}>{isAdmin ? 'Your account details.' : 'Your orders are delivered to the address below.'}</p>
            <form onSubmit={saveProfile}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p-name">Full name</label>
                  <input required {...detail('name')} />
                </div>
                <div className="form-group">
                  <label htmlFor="p-email">Email address</label>
                  <input id="p-email" value={user.email} readOnly />
                </div>
              </div>
              {/* Customers need these for delivery; admins don't */}
              {!isAdmin && (
                <>
                  <div className="form-group">
                    <label htmlFor="p-phone">Phone number</label>
                    <input type="tel" required placeholder="077 123 4567" {...detail('phone')} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="p-address">Delivery address</label>
                    <textarea rows={2} required maxLength={300} placeholder="House no., street, city" {...detail('address')} />
                  </div>
                </>
              )}
              <button className="btn btn-primary">Save changes</button>
            </form>
          </section>

          <section className="card card-pad" id="password">
            <h2 style={{ marginBottom: 20 }}>{hasPassword ? 'Change password' : 'Set a password'}</h2>
            {!hasPassword && <p className="muted small" style={{ marginBottom: 16 }}>You signed up with Google. Set a password if you also want to log in with your email.</p>}
            <form onSubmit={changePassword}>
              <div className="form-row">
                {hasPassword && (
                  <div className="form-group">
                    <label htmlFor="p-currentPassword">Current password</label>
                    <input type="password" required autoComplete="current-password" {...pw('currentPassword')} />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="p-newPassword">New password <span className="muted">(min 6 characters)</span></label>
                  <input type="password" minLength={6} required autoComplete="new-password" {...pw('newPassword')} />
                </div>
              </div>
              <button className="btn btn-outline">{hasPassword ? 'Update password' : 'Set password'}</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
