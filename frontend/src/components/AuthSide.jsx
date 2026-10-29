import { Link } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';

// Left half of the login / sign-up pages: the logo on the home page's flash-sale picture
export default function AuthSide() {
  return (
    <aside className="auth-side">
      <div className="auth-side-bg" aria-hidden="true" />
      <div className="auth-side-shade" aria-hidden="true" />
      <Link to="/" className="logo auth-side-logo" aria-label="SwiftDrop home">
        <Logo size={44} />
      </Link>
      <div className="kicker">Sri Lanka's flash sale destination</div>
      <h2>
        Great finds.
        <br />
        Gone fast.
      </h2>
      <p>Top brands at prices that don't last. Be ready when the next sale unlocks.</p>
      <div className="perks-list">
        <div><Icon name="clock" size={22} /> New flash sales every day</div>
        <div><Icon name="shield" size={22} /> Secure card payments or cash on delivery</div>
        <div><Icon name="truck" size={22} /> Delivered to your door, islandwide</div>
      </div>
    </aside>
  );
}
