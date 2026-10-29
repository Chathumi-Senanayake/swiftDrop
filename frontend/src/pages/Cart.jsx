// The cart = items reserved for this customer, each with its own timer.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Countdown from '../components/Countdown';
import Icon from '../components/Icon';
import Img from '../components/Img';
import { money } from '../utils';

export default function Cart() {
  const { cart, loaded, remove, refresh } = useCart();
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    refresh(); // the cart may have changed in another tab
  }, [refresh]);

  const total = cart.reduce((sum, o) => sum + o.price * o.quantity, 0);
  const firstExpiry = cart.reduce((min, o) => (!min || new Date(o.expiresAt) < new Date(min) ? o.expiresAt : min), null);

  async function removeOrder(id) {
    setBusyId(id);
    await remove(id);
    setBusyId(null);
  }

  return (
    <main className="container page">
      <h1 className="page-title">Your cart</h1>
      <p className="page-sub">Items in your cart are reserved just for you – but only for a few minutes.</p>

      {!loaded ? (
        <div className="skeleton" style={{ height: 280, marginTop: 20 }} />
      ) : cart.length === 0 ? (
        <div className="card empty" style={{ marginTop: 20 }}>
          <Icon name="cart" size={48} />
          <h2>Your cart is empty</h2>
          <p>Grab a deal before it's gone.</p>
          <Link to="/deals" className="btn btn-primary">Browse live deals</Link>
        </div>
      ) : (
        <div className="two-col" style={{ marginTop: 20 }}>
          <div>
            <div className="hold-banner">
              <Icon name="clock" size={22} />
              <span>
                Pay within <strong><Countdown target={firstExpiry} variant="text" onEnd={() => setTimeout(refresh, 1500)} /></strong> to keep
                {cart.length === 1 ? ' this item' : ' every item'}. After that, it goes back on sale.
              </span>
            </div>
            <div className="card" style={{ padding: '4px 22px' }}>
              {cart.map((o) => (
                <div key={o._id} className="line-item">
                  <Link to={'/items/' + o.itemId}><Img src={o.itemImage} alt={o.itemName} /></Link>
                  <div className="info">
                    <Link to={'/items/' + o.itemId} className="name">{o.itemName}</Link>
                    <div className="muted small">
                      {o.variant && <>{o.variant} · </>}
                      {o.eventName}
                    </div>
                    <div className="small" style={{ marginTop: 6 }}>
                      <span className="timer-pill"><Icon name="clock" size={14} strokeWidth={2.2} /> <Countdown target={o.expiresAt} variant="text" /></span>
                    </div>
                  </div>
                  <div className="right">
                    <strong>{money(o.price * o.quantity)}</strong>
                    <span className="muted small">Qty 1</span>
                    <button className="link-btn muted" disabled={busyId === o._id} onClick={() => removeOrder(o._id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/deals" className="text-link small row" style={{ marginTop: 16, gap: 6 }}>
              <Icon name="arrowLeft" size={14} /> Continue shopping
            </Link>
          </div>

          <aside className="card card-pad summary">
            <h2>Order summary</h2>
            <div className="sum-row"><span>Items ({cart.length})</span><span>{money(total)}</span></div>
            <div className="sum-row"><span>Delivery</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>Free</span></div>
            <div className="sum-row total"><span>Total</span><span>{money(total)}</span></div>
            <Link to="/checkout" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 16 }}>
              Proceed to checkout <Icon name="arrowRight" size={18} />
            </Link>
            <div className="secure-note"><Icon name="lock" size={14} /> Secure checkout · Card or cash on delivery</div>
          </aside>
        </div>
      )}
    </main>
  );
}
