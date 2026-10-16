import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import Img from '../components/Img';
import Countdown from '../components/Countdown';
import Tabs from '../components/Tabs';
import { formatDate, money, orderNumber } from '../utils';

const TABS = { all: 'All', reserved: 'Awaiting Payment', confirmed: 'Completed', cancelled: 'Cancelled' };
const STATUS_LABEL = { reserved: 'Awaiting payment', confirmed: 'Completed', cancelled: 'Cancelled' };

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      setOrders((await api('/me/orders')).orders);
    } catch (err) {
      toast(err.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // expired reservations are released by the server within ~15s
  const reloadAfterExpiry = useCallback(() => setTimeout(load, 16000), [load]);

  // Pay or cancel a reservation straight from this page
  async function act(orderId, action) {
    setBusyId(orderId);
    try {
      await api(`/purchase/${orderId}/${action}`, { method: 'POST' });
      toast(action === 'confirm' ? 'Payment confirmed. Enjoy your purchase!' : 'Reservation cancelled.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusyId(null);
    load();
  }

  const shown = orders.filter((o) => tab === 'all' || o.status === tab);

  return (
    <main className="container page">
      <h1 className="page-title">My Orders</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {shown.length === 0 && (
        <div className="card empty">
          No orders here yet. <Link to="/events">Browse events →</Link>
        </div>
      )}
      {shown.map((o) => (
        <div key={o._id} className="card order-card">
          <Img src={o.itemImage} alt={o.itemName} />
          <div className="info">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{orderNumber(o)}</strong>
              <span className={'badge badge-' + o.status}>{STATUS_LABEL[o.status]}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              {o.itemName}
              {o.variant && <span className="muted"> ({o.variant})</span>} <span className="muted">× {o.quantity}</span>
            </div>
            <div className="muted small">
              {o.eventName} • {formatDate(o.createdAt)}
            </div>
            {o.status === 'confirmed' && (
              <div className="small" style={{ marginTop: 6, color: o.deliveredAt ? 'var(--green)' : 'var(--muted)' }}>
                {o.deliveredAt ? `🚚 Delivered on ${formatDate(o.deliveredAt)}` : '📦 Preparing for delivery'}
              </div>
            )}
            {o.status === 'reserved' && (
              <div className="small" style={{ marginTop: 6, color: 'var(--amber)' }}>
                Pay within: <Countdown target={o.expiresAt} red onEnd={reloadAfterExpiry} />
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{money(o.price * o.quantity)}</div>
            {o.status === 'reserved' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" disabled={busyId === o._id} onClick={() => act(o._id, 'confirm')}>
                  Pay now
                </button>
                <button className="btn btn-ghost btn-sm" disabled={busyId === o._id} onClick={() => act(o._id, 'cancel')}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
