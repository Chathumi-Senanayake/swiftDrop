// Checkout: delivery details -> payment method -> pay.
//   /checkout              pays for everything in the cart
//   /checkout?orders=a,b   pays only for those reservations (used by "Buy now")
// Card payments go to PayHere's secure page; the order is confirmed when PayHere tells our server it was paid.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Countdown from '../components/Countdown';
import Icon from '../components/Icon';
import Img from '../components/Img';
import { money } from '../utils';

// Sends the browser to the payment gateway with a normal form POST (what PayHere expects)
function postToGateway({ action, fields }) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export default function Checkout() {
  const { user, updateUser } = useAuth();
  const { cart, loaded, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [methods, setMethods] = useState(null);
  const [method, setMethod] = useState('');
  const [details, setDetails] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/payments/methods')
      .then((m) => {
        setMethods(m);
        setMethod(m.card ? 'card' : m.cod ? 'cod' : '');
      })
      .catch((err) => setError(err.message));
  }, []);

  const wanted = params.get('orders')?.split(',').filter(Boolean);
  const orders = useMemo(() => (wanted ? cart.filter((o) => wanted.includes(o._id)) : cart), [cart, wanted?.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = orders.reduce((sum, o) => sum + o.price * o.quantity, 0);
  const firstExpiry = orders.reduce((min, o) => (!min || new Date(o.expiresAt) < new Date(min) ? o.expiresAt : min), null);

  async function pay(e) {
    e.preventDefault();
    if (!method) return setError('Please choose a payment method.');
    setBusy(true);
    setError('');
    try {
      // Save new delivery details to the profile first (the courier uses them)
      if (details.name !== user.name || details.phone !== (user.phone || '') || details.address !== (user.address || '')) {
        const { user: saved } = await api('/me', { method: 'PUT', body: details });
        updateUser(saved);
      }
      const { payment, gateway } = await api('/payments/checkout', { method: 'POST', body: { orderIds: orders.map((o) => o._id), method } });
      if (gateway) return postToGateway(gateway); // leaving the site -> keep the button disabled
      navigate('/payment/' + payment._id); // that page refreshes the cart
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
      refresh();
      setBusy(false);
    }
  }

  if (!loaded) return <main className="container page"><div className="skeleton" style={{ height: 420 }} /></main>;
  if (!orders.length)
    return (
      <main className="container page">
        <div className="card empty">
          <Icon name="cart" size={48} />
          <h2>Nothing to pay for</h2>
          <p>Your reservation may have run out. Items go back on sale when the timer reaches zero.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/cart" className="btn btn-ghost">View cart</Link>
            <Link to="/deals" className="btn btn-primary">Browse live deals</Link>
          </div>
        </div>
      </main>
    );

  const detail = (key) => ({ value: details[key], onChange: (e) => setDetails({ ...details, [key]: e.target.value }) });
  const option = (key, icon, title, text, extra) => {
    const available = methods?.[key];
    return (
      <label className={'pay-option' + (method === key ? ' active' : '') + (available ? '' : ' disabled')}>
        <input type="radio" name="method" value={key} checked={method === key} disabled={!available} onChange={() => setMethod(key)} />
        <div className="ico"><Icon name={icon} size={22} /></div>
        <div className="info">
          <strong>{title}</strong>
          <span>{available ? text : 'Not available right now'}</span>
        </div>
        {extra}
      </label>
    );
  };

  return (
    <main className="container page">
      <Link to="/cart" className="text-link small row" style={{ gap: 6, marginBottom: 12 }}>
        <Icon name="arrowLeft" size={14} /> Back to cart
      </Link>
      <h1 className="page-title">Checkout</h1>

      <form className="two-col" style={{ marginTop: 20 }} onSubmit={pay}>
        <div className="stack" style={{ gap: 20 }}>
          <div className="hold-banner" style={{ marginBottom: 0 }}>
            <Icon name="clock" size={22} />
            <span>
              Your items are reserved for <strong><Countdown target={firstExpiry} variant="text" onEnd={() => setTimeout(refresh, 1500)} /></strong>.
              {method === 'card' && ' When you continue to card payment, we hold them a little longer while you pay.'}
            </span>
          </div>

          <section className="card card-pad">
            <div className="step"><span className="n">1</span><h2>Delivery details</h2></div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="c-name">Full name</label>
                <input id="c-name" required autoComplete="name" {...detail('name')} />
              </div>
              <div className="form-group">
                <label htmlFor="c-phone">Phone number</label>
                <input id="c-phone" type="tel" required autoComplete="tel" placeholder="077 123 4567" {...detail('phone')} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="c-address">Delivery address</label>
              <textarea id="c-address" rows={2} required maxLength={300} autoComplete="street-address" placeholder="House no., street, city" {...detail('address')} />
              <div className="muted tiny" style={{ marginTop: 6 }}>We'll save these details to your profile for next time.</div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="step"><span className="n">2</span><h2>Payment method</h2></div>
            {!methods && !error && <div className="skeleton" style={{ height: 150 }} />}
            {methods && (
              <div className="pay-options">
                {option('card', 'card', 'Credit or debit card', 'Pay securely on PayHere – your card details never touch our servers.', (
                  <div className="card-brands"><span>VISA</span><span>MASTERCARD</span><span>AMEX</span></div>
                ))}
                {option('cod', 'cash', 'Cash on delivery', 'Pay the courier in cash when your parcel arrives.')}
                {method === 'card' && methods.sandbox && (
                  <div className="info-box warn">
                    <Icon name="info" size={18} />
                    <div><strong>Test mode</strong>Card payments are in PayHere sandbox mode – use a PayHere test card. No real money is charged.</div>
                  </div>
                )}
                {!methods.card && !methods.cod && <div className="form-error">No payment methods are available. Please contact support.</div>}
              </div>
            )}
          </section>
        </div>

        <aside className="card card-pad summary">
          <h2>Order summary</h2>
          {orders.map((o) => (
            <div key={o._id} className="line-item sm">
              <Img src={o.itemImage} alt={o.itemName} />
              <div className="info">
                <div className="name small">{o.itemName}</div>
                <div className="muted tiny">{o.variant ? `${o.variant} · ` : ''}Qty 1</div>
              </div>
              <strong className="small">{money(o.price * o.quantity)}</strong>
            </div>
          ))}
          <div className="sum-row" style={{ marginTop: 8 }}><span>Subtotal</span><span>{money(total)}</span></div>
          <div className="sum-row"><span>Delivery</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>Free</span></div>
          <div className="sum-row total"><span>Total</span><span>{money(total)}</span></div>

          <div className="form-error" style={{ marginTop: 12 }}>{error}</div>
          <button className="btn btn-primary btn-lg btn-block" disabled={busy || !method}>
            {busy ? 'Please wait…' : method === 'cod' ? 'Place order' : `Pay ${money(total)}`}
            {!busy && <Icon name={method === 'cod' ? 'check' : 'lock'} size={18} />}
          </button>
          <div className="secure-note">
            <Icon name="shield" size={14} />
            {method === 'cod' ? 'Pay in cash when your parcel arrives.' : "You'll be taken to PayHere's secure page to pay."}
          </div>
        </aside>
      </form>
    </main>
  );
}
