// Left menu shared by all admin pages
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="container page">
      <div className="side-layout">
        <aside className="card side-menu">
          <div className="muted small" style={{ padding: '6px 12px 10px' }}>
            ADMIN
          </div>
          <NavLink to="/admin" end>📊 Dashboard</NavLink>
          <NavLink to="/admin/events/new">➕ Create Event</NavLink>
          <NavLink to="/admin/deliveries">🚚 Deliveries</NavLink>
          <NavLink to="/admin/users">👥 Users</NavLink>
          <Link to="/">🛍 View Store</Link>
          <button className="danger" onClick={() => logout().then(() => navigate('/login'))}>
            ↪ Logout
          </button>
        </aside>
        {children}
      </div>
    </main>
  );
}
