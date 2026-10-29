import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Img from '../components/Img';
import Icon from '../components/Icon';
import Countdown from '../components/Countdown';
import Tabs from '../components/Tabs';
import { PAYMENT_LABEL, formatDate, money, orderNumber } from '../utils';

const TABS = { all: 'All', reserved: 'Awaiting payment', confirmed: 'Completed', cancelled: 'Cancelled' };
const STATUS_LABEL = { reserved: 'Awaiting payment', confirmed: 'Confirmed', cancelled: 'Cancelled' };

export default function Orders() {
  const { orders, loaded, remove, refresh } = useCart();
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function cancel(id) {
    setBusyId(id);
    await remove(id);
    setBusyId(null);
  }

  const counts = Object.fromEntries(Object.keys(TABS).map((k) => [k, k === 'all' ? orders.length : orders.filter((o) => o.status === k).length]));
  const shown = orders.filter((o) => tab === 'all' || o.status === tab);

  return (
    <main className="container page">
      <h1 className="page-title">My orders</h1>
      <p className="page-sub">Track your purchases and deliveries.</p>
      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={counts} />

      {loaded && shown.length === 0 && (
        <div className="card empty">
          <Icon name="box" size={48} />
          <h2>No orders here yet</h2>
          <p>When you buy something it shows up here.</p>
          <Link to="/deals" className="btn btn-primary">Browse live deals</Link>
        </div>
      )}
      {shown.map((o) => (
        <div key={o._id} className="card order-card">
          <Link to={'/items/' + o.itemId}><Img src={o.itemImage} alt={o.itemName} /></Link>
          <div className="info">
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <strong>{orderNumber(o)}</strong>
              <span className={'badge badge-' + o.status}>{STATUS_LABEL[o.status]}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <Link to={'/items/' + o.itemId} className="strong">{o.itemName}</Link>
              {o.variant && <span className="muted"> · {o.variant}</span>} <span className="muted">× {o.quantity}</span>
            </div>
            <div className="order-meta">
              <span><Icon name="calendar" size={14} /> {formatDate(o.createdAt)}</span>
              <span><Icon name="tag" size={14} /> {o.eventName}</span>
              {o.status === 'confirmed' && (
                <span><Icon name={o.paymentMethod === 'cod' ? 'cash' : 'card'} size={14} /> {PAYMENT_LABEL[o.paymentMethod] || 'Paid'}{o.paymentMethod === 'cod' && o.paidAt && ' · paid'}</span>
              )}
              {o.status === 'confirmed' && (
                <span className={o.deliveredAt ? 'ok' : ''}>
                  <Icon name="truck" size={14} /> {o.deliveredAt ? `Delivered ${formatDate(o.deliveredAt)}` : 'Preparing for delivery'}
                </span>
              )}
              {o.status === 'reserved' && new Date(o.expiresAt) > Date.now() && (
                <span className="warn"><Icon name="clock" size={14} /> Pay within <Countdown target={o.expiresAt} variant="text" onEnd={() => setTimeout(refresh, 16000)} /></span>
              )}
            </div>
          </div>
          <div className="right">
            <strong style={{ fontSize: 18 }}>{money(o.price * o.quantity)}</strong>
            {o.status === 'reserved' && new Date(o.expiresAt) > Date.now() && (
              <div className="row" style={{ gap: 6 }}>
                <Link to={'/checkout?orders=' + o._id} className="btn btn-primary btn-sm">Pay now</Link>
                <button className="btn btn-ghost btn-sm" disabled={busyId === o._id} onClick={() => cancel(o._id)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
