import { Link } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div>
          <Link to="/" className="logo">
            <Logo size={32} />
          </Link>
          <p>Sri Lanka's flash sale destination. Top brands, limited stock, prices that don't last.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <Link to="/deals">Live deals</Link>
          <Link to="/events?tab=locked">Upcoming sales</Link>
          <Link to="/events?tab=ended">Past sales</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/orders">My orders</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/profile">Profile</Link>
        </div>
        <div>
          <h4>We accept</h4>
          <div className="card-brands" style={{ marginBottom: 10 }}>
            <span>VISA</span>
            <span>MASTERCARD</span>
            <span>AMEX</span>
          </div>
          <span className="muted small">Cash on delivery islandwide</span>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} SwiftDrop · Card payments are processed securely by PayHere</div>
    </footer>
  );
}
