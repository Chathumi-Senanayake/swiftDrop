import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useInterval } from '../../hooks';
import AdminLayout from '../../components/AdminLayout';
import Img from '../../components/Img';
import Icon from '../../components/Icon';
import StatusBadge from '../../components/StatusBadge';
import Countdown from '../../components/Countdown';
import { formatDate, money, orderNumber } from '../../utils';

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);

  // quiet = background refresh: a failed one is not worth a pop-up every 5 seconds
  const load = useCallback(async (quiet) => {
    try {
      setData(await api('/admin/dashboard'));
    } catch (err) {
      if (!quiet) toast(err.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);
  useInterval(() => load(true), 5000); // real-time sales monitoring

  // Open / close / delete an event
  async function act(id, action, question) {
    if (!window.confirm(question)) return;
    try {
      if (action === 'delete') await api('/admin/events/' + id, { method: 'DELETE' });
      else await api(`/admin/events/${id}/${action}`, { method: 'POST' });
      toast('Done.', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function markRefunded(id) {
    if (!window.confirm('Have you sent this refund from the PayHere merchant portal?')) return;
    try {
      await api(`/admin/payments/${id}/refunded`, { method: 'POST' });
      toast('Refund marked as done.', 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <AdminLayout>
      <div>
        <div className="row-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="muted small">
              <span className="live-dot" /> Updates every 5 seconds
            </p>
          </div>
          <Link to="/admin/events/new" className="btn btn-primary">
            <Icon name="plus" size={18} /> Create sale
          </Link>
        </div>

        {data && (
          <>
            <div className="grid stats-grid" style={{ margin: '20px 0' }}>
              <Stat icon="calendar" label="Total sales" value={data.totals.events} />
              <Stat icon="bolt" label="Live now" value={data.totals.live} />
              <Stat icon="box" label="Units sold" value={data.totals.orders} />
              <Stat icon="chart" label="Total revenue" value={money(data.totals.revenue)} />
            </div>

            {data.refunds?.length > 0 && (
              <div className="card card-pad" style={{ marginBottom: 20, borderColor: 'var(--red)' }}>
                <h2 style={{ marginBottom: 4 }}>Refunds needed</h2>
                <p className="muted small" style={{ marginBottom: 12 }}>
                  These customers paid by card, but the item could not be filled (the reservation ran out and it sold out). Refund them from the PayHere merchant portal.
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Customer</th><th>Items to refund</th><th>Amount</th><th>PayHere ref</th><th>Paid</th><th></th></tr>
                    </thead>
                    <tbody>
                      {data.refunds.map((p) => (
                        <tr key={p._id}>
                          <td>{p.userId?.name}<div className="muted small">{p.userId?.email} · {p.userId?.phone}</div></td>
                          <td>{p.refundOrderIds.map((o) => <div key={o._id}>{o.itemName}{o.variant && ` (${o.variant})`}</div>)}</td>
                          <td><strong>{money(p.refundOrderIds.reduce((s, o) => s + o.price * o.quantity, 0))}</strong></td>
                          <td className="small">{p.gatewayRef || '—'}</td>
                          <td className="muted small">{formatDate(p.paidAt)}</td>
                          <td>
                            <button className="btn btn-success btn-sm" onClick={() => markRefunded(p._id)}>Mark refunded</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="card card-pad">
              <h2 style={{ marginBottom: 12 }}>Sales</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th></th><th>Event</th><th>Status</th><th>Items (sold / stock)</th><th>Revenue</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {data.events.length === 0 && (
                      <tr><td colSpan={6} className="empty">No events yet.</td></tr>
                    )}
                    {data.events.map((e) => (
                      <EventRow key={e._id} event={e} act={act} onCountdownEnd={load} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card card-pad" style={{ marginTop: 20 }}>
              <h2 style={{ marginBottom: 12 }}>Recent orders</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Order #</th><th>Customer</th><th>Item</th><th>Total</th><th>Payment</th><th>Status</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.length === 0 && (
                      <tr><td colSpan={7} className="empty">No orders yet.</td></tr>
                    )}
                    {data.recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td>{orderNumber(o)}</td>
                        <td>{o.userId?.name || 'Deleted user'}</td>
                        <td>
                          {o.itemName}
                          {o.variant && <span className="muted"> ({o.variant})</span>}
                        </td>
                        <td>{money(o.price * o.quantity)}</td>
                        <td className="small">{o.status === 'confirmed' ? (o.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card') : <span className="muted">—</span>}</td>
                        <td><span className={'badge badge-' + o.status}>{o.status === 'reserved' ? 'in cart' : o.status}</span></td>
                        <td className="muted small">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="card stat-card">
      <div className="ico"><Icon name={icon} size={22} /></div>
      <div>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
      </div>
    </div>
  );
}

function EventRow({ event: e, act, onCountdownEnd }) {
  return (
    <tr>
      <td><Img src={e.coverImage} className="thumb-sm" /></td>
      <td>
        <strong>{e.name}</strong>
        <div className="muted small">{formatDate(e.goLiveAt)}</div>
      </td>
      <td>
        <StatusBadge status={e.status} />
        {e.status === 'locked' && (
          <div style={{ marginTop: 6 }}>
            <Countdown target={e.goLiveAt} onEnd={onCountdownEnd} />
          </div>
        )}
      </td>
      <td>
        {e.items.map((i) => (
          <div key={i._id} className="item-line">
            {i.name}
            <div>
              <strong style={{ color: 'var(--text)' }}>{i.sold}</strong> sold · {i.stock}/{i.quantity} left · {money(i.revenue)}
            </div>
          </div>
        ))}
      </td>
      <td>
        <strong>{money(e.revenue)}</strong>
        <div className="muted small">{e.sold} units</div>
      </td>
      <td>
        <div className="actions">
          {e.status === 'locked' && (
            <>
              <Link className="btn btn-outline btn-sm" to={`/admin/events/${e._id}/edit`}>Edit</Link>
              <button className="btn btn-success btn-sm" onClick={() => act(e._id, 'open', 'Open this event now?')}>Open now</button>
              <button className="btn btn-danger btn-sm" onClick={() => act(e._id, 'delete', 'Delete this event? This cannot be undone.')}>Delete</button>
            </>
          )}
          {(e.status === 'live' || e.status === 'soldout') && (
            <button className="btn btn-danger btn-sm" onClick={() => act(e._id, 'close', 'Close this event now? Customers will no longer be able to buy.')}>
              Close
            </button>
          )}
          <Link className="btn btn-ghost btn-sm" to={'/events/' + e._id}>View</Link>
        </div>
      </td>
    </tr>
  );
}
