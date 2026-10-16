// Route guard: sends guests to the login page, and blocks pages meant for another role.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to={'/login?next=' + encodeURIComponent(location.pathname + location.search)} replace />;
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/" replace />;
  if (role === 'customer' && user.role !== 'customer') return <Navigate to="/admin" replace />;
  return children;
}
