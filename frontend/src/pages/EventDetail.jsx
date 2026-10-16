import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useInterval } from '../hooks';
import StatusBadge from '../components/StatusBadge';
import Countdown from '../components/Countdown';
import ItemCard from '../components/ItemCard';
import Modal from '../components/Modal';
import ItemDetailsModal from '../components/ItemDetailsModal';
import { formatDate, money, orderNumber } from '../utils';

export default function EventDetail() {
  const { id: eventId } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [myOrders, setMyOrders] = useState({}); // itemId -> my active order (reserved or confirmed)
  const [busyItemId, setBusyItemId] = useState(null); // item whose Buy button is waiting for the server
  const [modal, setModal] = useState(null); // { type: 'pay' | 'success', itemId }
  const [detailsItemId, setDetailsItemId] = useState(null); // item whose details popup is open
  const [modalBusy, setModalBusy] = useState(false);

  // ---------- Data ----------
  const loadMyOrders = useCallback(async () => {
    if (isAdmin) return; // admins never buy
    const { orders } = await api('/me/orders');
    const map = {};
    orders.filter((o) => o.status !== 'cancelled').forEach((o) => (map[o.itemId] = o));
    setMyOrders(map);
  }, [isAdmin]);

  useEffect(() => {
    (async () => {
      try {
        const { event } = await api('/events/' + eventId);
        document.title = 'SwiftDrop – ' + event.name;
        await loadMyOrders();
        setEvent(event);
      } catch (err) {
        setError(err.message);
      }
    })();
    return () => (document.title = 'SwiftDrop – Flash Deals');
  }, [eventId, loadMyOrders]);

  // Real-time stock: ask the server for fresh numbers (no page reload)
  const refreshStock = useCallback(async () => {
    try {
      const fresh = await api(`/events/${eventId}/stock`);
      setEvent((e) => ({
        ...e,
        status: fresh.status,
        items: e.items.map((i) => ({ ...i, ...fresh.items.find((f) => f._id === i._id) })),
      }));
    } catch {}
  }, [eventId]);

  useInterval(refreshStock, event && event.status !== 'closed' ? 2000 : null);

  // ---------- Buying ----------
  async function buy(itemId, variant) {
    setBusyItemId(itemId); // disables the button right away (no double clicks)
    try {
      const { order } = await api('/purchase/reserve', { method: 'POST', body: { itemId, variant } });
      setMyOrders((m) => ({ ...m, [itemId]: order }));
      setDetailsItemId(null);
      setModal({ type: 'pay', itemId });
    } catch (err) {
      toast(err.message, 'error');
      if (err.code === 'PROFILE_INCOMPLETE') return navigate('/profile');
      refreshStock();
    } finally {
      setBusyItemId(null);
    }
  }

  async function confirmPay(itemId) {
    setModalBusy(true);
    try {
      const { order } = await api(`/purchase/${myOrders[itemId]._id}/confirm`, { method: 'POST' });
      setMyOrders((m) => ({ ...m, [itemId]: order }));
      setModal({ type: 'success', itemId });
    } catch (err) {
      toast(err.message, 'error');
      setModal(null);
      await loadMyOrders();
      refreshStock();
    } finally {
      setModalBusy(false);
    }
  }

  async function cancelPay(itemId) {
    setModalBusy(true);
    try {
      await api(`/purchase/${myOrders[itemId]._id}/cancel`, { method: 'POST' });
      toast('Reservation cancelled. The item was released.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
    setMyOrders(({ [itemId]: _, ...rest }) => rest);
    setModal(null);
    setModalBusy(false);
    refreshStock();
  }

  if (error)
    return (
      <main className="container page">
        <Link to="/events">← Back to Events</Link>
        <div className="card empty" style={{ marginTop: 16 }}>{error}</div>
      </main>
    );
  if (!event) return null;

  const order = modal && myOrders[modal.itemId];

  return (
    <main className="container page">
      <Link to="/events">← Back to Events</Link>

      <div className="banner" style={{ backgroundImage: `url('${event.coverImage}')` }}>
        <div className="banner-content">
          <div>
            <StatusBadge status={event.status} />
            <h1>{event.name}</h1>
            <p className="muted">{event.description}</p>
            <div className="chips">
              <span>📦 {event.itemCount} items</span>
              <span>⏱ Limited stock</span>
              <span>🚫 No restocks</span>
              <span>🗓 {formatDate(event.goLiveAt)}</span>
            </div>
          </div>
          <div className="banner-side">
            {event.status === 'locked' && (
              <div>
                <div className="muted small" style={{ marginBottom: 6 }}>Goes live in</div>
                {/* countdown reached zero -> event is now live */}
                <Countdown target={event.goLiveAt} onEnd={refreshStock} />
              </div>
            )}
            {event.status === 'live' && (
              <div className="small">
                <span className="live-dot" />
                Live — stock updates in real time
              </div>
            )}
            {event.status === 'soldout' && <div className="small muted">Every item has sold out</div>}
            {event.status === 'closed' && <div className="small muted">This event has ended</div>}
          </div>
        </div>
      </div>

      <h2 style={{ margin: '30px 0 14px' }}>Items</h2>
      <div className="grid grid-4">
        {event.items.map((item) => (
          <ItemCard
            key={item._id}
            item={item}
            eventStatus={event.status}
            myOrder={myOrders[item._id]}
            busy={busyItemId === item._id}
            isAdmin={isAdmin}
            onBuy={(variant) => buy(item._id, variant)}
            onPay={() => setModal({ type: 'pay', itemId: item._id })}
            onDetails={() => setDetailsItemId(item._id)}
          />
        ))}
      </div>

      {detailsItemId && !modal && (
        <ItemDetailsModal
          item={event.items.find((i) => i._id === detailsItemId)}
          event={event}
          myOrder={myOrders[detailsItemId]}
          isAdmin={isAdmin}
          busy={busyItemId === detailsItemId}
          onBuy={(variant) => buy(detailsItemId, variant)}
          onPay={() => {
            setModal({ type: 'pay', itemId: detailsItemId });
            setDetailsItemId(null);
          }}
          onClose={() => setDetailsItemId(null)}
        />
      )}

      {modal?.type === 'pay' && order && (
        <Modal>
          <h2>Confirm your purchase</h2>
          <p className="muted small" style={{ marginBottom: 16 }}>
            Your item is reserved. Complete payment before the timer runs out.
          </p>
          <div style={{ marginBottom: 16 }}>
            <Countdown target={order.expiresAt} red />
          </div>
          <div className="summary-row"><span className="muted">Item</span><span>{order.itemName}</span></div>
          <div className="summary-row"><span className="muted">Event</span><span>{order.eventName}</span></div>
          {order.variant && <div className="summary-row"><span className="muted">Variety</span><span>{order.variant}</span></div>}
          <div className="summary-row"><span className="muted">Quantity</span><span>1</span></div>
          <div className="summary-row">
            <span className="muted">Deliver to</span>
            <span style={{ textAlign: 'right' }}>{user.address}<br /><span className="muted small">{user.phone} · <Link to="/profile">change</Link></span></span>
          </div>
          <div className="summary-row" style={{ fontWeight: 700, fontSize: 16 }}><span>Total</span><span>{money(order.price)}</span></div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Card number (demo – no real payment is taken)</label>
            <input value="4242 4242 4242 4242" readOnly />
          </div>
          <button className="btn btn-primary btn-block" disabled={modalBusy} onClick={() => confirmPay(modal.itemId)}>
            Confirm Payment
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} disabled={modalBusy} onClick={() => cancelPay(modal.itemId)}>
            Cancel & release item
          </button>
        </Modal>
      )}

      {modal?.type === 'success' && order && (
        <Modal>
          <div style={{ textAlign: 'center' }}>
            <div className="success-icon">✓</div>
            <h2>Purchase Successful!</h2>
            <p className="muted" style={{ marginBottom: 18 }}>
              Your order has been confirmed. Thank you for shopping with SwiftDrop.
            </p>
          </div>
          <div className="summary-row"><span className="muted">Order Number</span><span>{orderNumber(order)}</span></div>
          <div className="summary-row"><span className="muted">Item</span><span>{order.itemName}</span></div>
          {order.variant && <div className="summary-row"><span className="muted">Variety</span><span>{order.variant}</span></div>}
          <div className="summary-row"><span className="muted">Total Paid</span><span>{money(order.price)}</span></div>
          <div className="summary-row"><span className="muted">Purchase Time</span><span>{formatDate(order.updatedAt)}</span></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <Link to="/orders" className="btn btn-primary" style={{ flex: 1 }}>
              View My Orders
            </Link>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setModal(null)}>
              Continue Shopping
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
