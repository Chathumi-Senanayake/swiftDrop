// Paid orders grouped by customer: one card = one parcel to pack and deliver.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import Img from '../../components/Img';
import Icon from '../../components/Icon';
import Tabs from '../../components/Tabs';
import { formatDate, money, orderNumber } from '../../utils';

const TABS = { pending: 'To Deliver', delivered: 'Delivered' };

export default function Deliveries() {
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState(''); // search text, applied 300ms after typing stops
  const [customers, setCustomers] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const data = await api(`/admin/deliveries?status=${tab}&search=${encodeURIComponent(query)}`);
      setCustomers(data.customers);
    } catch (err) {
      toast(err.message, 'error');
    }
  }, [tab, query, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function markDelivered(c) {
    if (!window.confirm(`Mark all ${c.units} item(s) for ${c.user.name} as delivered?`)) return;
    setBusyId(c._id);
    try {
      const { message } = await api(`/admin/deliveries/${c._id}/delivered`, { method: 'POST' });
      toast(message, 'success');
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusyId(null);
  }

  return (
    <AdminLayout>
      <div>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Deliveries</h1>
            <p className="muted small">Confirmed orders grouped by customer – pack each card as one parcel.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="Search name, phone, address…" style={{ maxWidth: 260 }} value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn btn-outline" onClick={() => window.print()}><Icon name="printer" size={18} /> Print</button>
          </div>
        </div>
        <div className="no-print" style={{ marginTop: 14 }}>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {customers && customers.length === 0 && (
          <div className="card empty">
            <Icon name="truck" size={44} />
            <h2>{tab === 'pending' ? 'Nothing waiting for delivery' : 'No delivered orders yet'}</h2>
          </div>
        )}

        {customers?.map((c) => {
          // Cash-on-delivery orders the courier still has to collect money for
          const collect = c.orders.filter((o) => o.paymentMethod === 'cod' && !o.paidAt).reduce((s, o) => s + o.price * o.quantity, 0);
          return (
          <div key={c._id} className="card card-pad delivery-card">
            <div className="delivery-head">
              <div>
                <h2>{c.user.name}</h2>
                <div className="small"><Icon name="phone" size={14} /> {c.user.phone || <span className="muted">no phone</span>}</div>
                <div className="small"><Icon name="pin" size={14} /> {c.user.address || <span className="muted">no address</span>}</div>
                <div className="muted small">{c.user.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="muted small">{c.units} item(s)</div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>{money(c.total)}</div>
                {collect > 0 && <div className="collect">Collect {money(collect)} cash</div>}
                {tab === 'pending' ? (
                  <div>
                    <button className="btn btn-success btn-sm no-print" style={{ marginTop: 8 }} disabled={busyId === c._id} onClick={() => markDelivered(c)}>
                      <Icon name="check" size={16} /> Mark as delivered
                    </button>
                  </div>
                ) : (
                  <div className="small" style={{ color: 'var(--green)', marginTop: 6 }}>Delivered {formatDate(c.deliveredAt)}</div>
                )}
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th></th><th>Item</th><th>Variety</th><th>Sale</th><th>Order #</th><th>Payment</th><th>Ordered</th><th>Price</th></tr>
                </thead>
                <tbody>
                  {c.orders.map((o) => (
                    <tr key={o._id}>
                      <td><Img src={o.itemImage} alt="" className="delivery-thumb" /></td>
                      <td>{o.itemName} <span className="muted">× {o.quantity}</span></td>
                      <td>{o.variant || <span className="muted">—</span>}</td>
                      <td className="muted small">{o.eventName}</td>
                      <td>{orderNumber(o)}</td>
                      <td className="small">{o.paymentMethod === 'cod' ? (o.paidAt ? 'Cash – collected' : 'Cash on delivery') : 'Card – paid'}</td>
                      <td className="muted small">{formatDate(o.createdAt)}</td>
                      <td>{money(o.price * o.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
