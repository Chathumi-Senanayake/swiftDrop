import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const here = location.pathname + location.search;

  const link = (to, text) => (
    <Link to={to} className={here === to ? 'active' : ''}>
      {text}
    </Link>
  );

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">
          Swift<span>Drop</span>
        </Link>
        <div className="nav-links">
          {link('/', 'Home')}
          {link('/events?tab=locked', 'Upcoming')}
          {link('/events?tab=live', 'Live Now')}
          {link('/events?tab=ended', 'Past Events')}
          {user && !isAdmin && link('/orders', 'My Orders')}
          {isAdmin && link('/admin', 'Admin')}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <Link to="/profile" className="avatar" title={user.name}>
                {initials(user.name)}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
