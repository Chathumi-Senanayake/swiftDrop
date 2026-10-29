// Left menu shared by all admin pages
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="container page">
      <div className="side-layout">
        <aside className="card side-menu">
          <div className="menu-label">ADMIN</div>
          <NavLink to="/admin" end><Icon name="grid" size={18} /> Dashboard</NavLink>
          <NavLink to="/admin/events/new"><Icon name="plus" size={18} /> Create sale</NavLink>
          <NavLink to="/admin/deliveries"><Icon name="truck" size={18} /> Deliveries</NavLink>
          <NavLink to="/admin/users"><Icon name="users" size={18} /> Users</NavLink>
          <hr />
          <Link to="/"><Icon name="store" size={18} /> View store</Link>
          <button className="danger" onClick={() => logout().then(() => navigate('/login'))}>
            <Icon name="logout" size={18} /> Log out
          </button>
        </aside>
        {children}
      </div>
    </main>
  );
}
