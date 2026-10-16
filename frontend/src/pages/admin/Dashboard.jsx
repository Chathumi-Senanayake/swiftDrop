import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useInterval } from '../../hooks';
import AdminLayout from '../../components/AdminLayout';
import Img from '../../components/Img';
import StatusBadge from '../../components/StatusBadge';
import Countdown from '../../components/Countdown';
import { formatDate, money, orderNumber } from '../../utils';

export default function Dashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api('/admin/dashboard'));
    } catch (err) {
      toast(err.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);
  useInterval(load, 5000); // real-time sales monitoring

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

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="muted small">
              <span className="live-dot" />
              Updates every 5 seconds
            </p>
          </div>
          <Link to="/admin/events/new" className="btn btn-primary">
            + Create Event
          </Link>
        </div>

        {data && (
          <>
            <div className="grid stats-grid" style={{ margin: '20px 0' }}>
              <Stat label="Total Events" value={data.totals.events} />
              <Stat label="Live Now" value={data.totals.live} />
              <Stat label="Units Sold" value={data.totals.orders} />
              <Stat label="Total Revenue" value={money(data.totals.revenue)} />
            </div>

            <div className="card card-pad">
              <h2 style={{ marginBottom: 12 }}>Events</h2>
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
              <h2 style={{ marginBottom: 12 }}>Recent Sales</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Order #</th><th>Customer</th><th>Item</th><th>Total</th><th>Status</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.length === 0 && (
                      <tr><td colSpan={6} className="empty">No sales yet.</td></tr>
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
                        <td><span className={'badge badge-' + o.status}>{o.status}</span></td>
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

function Stat({ label, value }) {
  return (
    <div className="card stat-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
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
