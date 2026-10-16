import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { initials } from '../utils';

export default function Profile() {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [details, setDetails] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

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
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    try {
      await api('/me/password', { method: 'PUT', body: passwords });
      setPasswords({ currentPassword: '', newPassword: '' });
      toast('Password changed.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const detail = (key) => ({ value: details[key], onChange: (e) => setDetails({ ...details, [key]: e.target.value }) });
  const pw = (key) => ({ value: passwords[key], onChange: (e) => setPasswords({ ...passwords, [key]: e.target.value }) });

  return (
    <main className="container page">
      <div className="side-layout">
        <aside className="card side-menu">
          <a href="#profile" className="active">👤 Profile</a>
          {!isAdmin && <Link to="/orders">📦 My Orders</Link>}
          <a href="#password">🔑 Change Password</a>
          <button className="danger" onClick={() => logout().then(() => navigate('/login'))}>↪ Logout</button>
        </aside>

        <div>
          <section className="card card-pad" id="profile">
            <h2 style={{ marginBottom: 18 }}>Profile</h2>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 }}>
              <div className="avatar lg">{initials(user.name)}</div>
              <div>
                <strong>{user.name}</strong>
                <div className="muted small">{user.email}</div>
              </div>
            </div>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label>Display Name</label>
                <input required {...detail('name')} />
              </div>
              {/* Customers need these for delivery; admins don't */}
              {!isAdmin && (
                <>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" required placeholder="077 123 4567" {...detail('phone')} />
                  </div>
                  <div className="form-group">
                    <label>Delivery Address</label>
                    <textarea rows={2} required maxLength={300} placeholder="House no., street, city" {...detail('address')} />
                  </div>
                </>
              )}
              <div className="form-group">
                <label>Email Address</label>
                <input value={user.email} readOnly />
              </div>
              <button className="btn btn-primary">Save Changes</button>
            </form>
          </section>

          <section className="card card-pad" id="password" style={{ marginTop: 20 }}>
            <h2 style={{ marginBottom: 18 }}>Change Password</h2>
            <form onSubmit={changePassword}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" required {...pw('currentPassword')} />
              </div>
              <div className="form-group">
                <label>New Password (min 6 characters)</label>
                <input type="password" minLength={6} required {...pw('newPassword')} />
              </div>
              <button className="btn btn-primary">Update Password</button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
