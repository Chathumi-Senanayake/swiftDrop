import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Icon from './Icon';
import Logo from './Logo';
import { initials } from '../utils';

// Closes a dropdown when the user clicks somewhere else or the page changes
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return { open, setOpen, ref };
}

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  const wishlist = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [events, setEvents] = useState(null); // null = not loaded yet
  const sales = useDropdown();
  const account = useDropdown();
  const here = location.pathname + location.search;

  useEffect(() => {
    setSearch(params.get('q') || '');
  }, [params]);

  // Sales menu: what's live and coming up (refreshed each time it opens)
  useEffect(() => {
    if (sales.open) api('/events').then((d) => setEvents(d.events)).catch(() => setEvents((list) => list || []));
  }, [sales.open]);

  function submitSearch(e) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? '/deals?q=' + encodeURIComponent(q) : '/deals');
  }

  const link = (to, text) => (
    <Link to={to} className={here === to ? 'active' : ''}>
      {text}
    </Link>
  );

  const menuEvents = [...(events || []).filter((e) => e.status === 'live'), ...(events || []).filter((e) => e.status === 'locked')];

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo" aria-label="SwiftDrop home">
          <Logo size={34} />
        </Link>

        <form className="nav-search" onSubmit={submitSearch} role="search">
          <Icon name="search" size={18} />
          <input type="search" placeholder="Search for products, brands or sales…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        </form>

        <div className="nav-links">
          {link('/deals', 'Deals')}
          {link('/events?tab=locked', 'Upcoming')}
          <div className="dropdown" ref={sales.ref}>
            <button onClick={() => sales.setOpen(!sales.open)} aria-expanded={sales.open}>
              Sales <Icon name="chevronDown" size={16} />
            </button>
            {sales.open && (
              <div className="dropdown-menu">
                <div className="menu-label">Live & upcoming sales</div>
                {menuEvents.length === 0 && (
                  <div className="muted small" style={{ padding: '6px 12px' }}>{events ? 'No live or upcoming sales right now.' : 'Loading…'}</div>
                )}
                {menuEvents.slice(0, 8).map((e) => (
                  <Link key={e._id} to={'/events/' + e._id}>
                    <span className={'ev-dot' + (e.status === 'live' ? ' live' : '')} />
                    {e.name}
                  </Link>
                ))}
                <Link to="/events" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  All sales <Icon name="arrowRight" size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="nav-icons">
          <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
            <Icon name="heart" size={22} />
            {wishlist.items.length > 0 && <span className="count">{wishlist.items.length}</span>}
          </Link>
          {!isAdmin && (
            <Link to="/cart" className="icon-btn" aria-label="Cart">
              <Icon name="cart" size={22} />
              {cart.length > 0 && <span className="count">{cart.length}</span>}
            </Link>
          )}

          <div className="dropdown" ref={account.ref}>
            {user ? (
              <button className="avatar" style={{ marginLeft: 6 }} onClick={() => account.setOpen(!account.open)} aria-label="Account menu" aria-expanded={account.open}>
                {initials(user.name)}
              </button>
            ) : (
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }}>
                Log in
              </Link>
            )}
            {account.open && user && (
              <div className="dropdown-menu">
                <div className="menu-head">
                  <strong>{user.name}</strong>
                  <div className="muted small">{user.email}</div>
                </div>
                <Link to="/deals" className="mobile-only"><Icon name="tag" size={18} /> Deals</Link>
                <Link to="/events" className="mobile-only"><Icon name="calendar" size={18} /> All sales</Link>
                {isAdmin && <Link to="/admin"><Icon name="grid" size={18} /> Admin dashboard</Link>}
                {!isAdmin && <Link to="/orders"><Icon name="box" size={18} /> My orders</Link>}
                <Link to="/wishlist"><Icon name="heart" size={18} /> Wishlist</Link>
                <Link to="/profile"><Icon name="user" size={18} /> Profile</Link>
                <button className="danger" onClick={() => logout().then(() => navigate('/login'))}>
                  <Icon name="logout" size={18} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
