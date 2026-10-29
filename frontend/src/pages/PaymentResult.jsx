// Where the customer lands after paying (PayHere sends them back here), or after placing a cash-on-delivery order.
// The page waits for OUR server to confirm the payment – returning from PayHere alone proves nothing.
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useInterval } from '../hooks';
import Icon from '../components/Icon';
import Img from '../components/Img';
import { formatDate, money, orderNumber } from '../utils';

const WAIT_MS = 3 * 60 * 1000; // stop asking after 3 minutes

export default function PaymentResult() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { refresh } = useCart();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [startedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const cancelled = params.get('cancelled') === '1';

  const load = useCallback(async () => {
    try {
      const { payment } = await api('/payments/' + id);
      setPayment(payment);
      if (payment.status !== 'pending') refresh();
    } catch (err) {
      setError(err.message);
    }
    setNow(Date.now());
  }, [id, refresh]);

  useEffect(() => {
    load();
  }, [load]);

  const waiting = payment?.status === 'pending' && !cancelled && now - startedAt < WAIT_MS;
  useInterval(load, waiting ? 2500 : null);

  if (error)
    return (
      <main className="container page">
        <div className="card empty"><Icon name="alert" size={44} /><h2>{error}</h2><Link to="/orders" className="btn btn-primary">My orders</Link></div>
      </main>
    );
  if (!payment) return <main className="container page"><div className="result"><div className="spinner" style={{ margin: '0 auto', color: 'var(--primary)' }} /></div></main>;

  const success = payment.status === 'paid' || payment.status === 'pay_on_delivery';
  const refunds = payment.refundOrderIds || [];
  const filled = payment.orders.filter((o) => o.status === 'confirmed' && !refunds.includes(o._id));

  let view;
  if (success) {
    view = {
      icon: 'check', tone: 'ok',
      title: payment.method === 'cod' ? 'Order placed!' : 'Payment successful!',
      text: payment.method === 'cod'
        ? `Please keep ${money(filled.reduce((s, o) => s + o.price * o.quantity, 0))} ready in cash for the courier.`
        : `We received ${money(payment.amount)}. Thank you for shopping with SwiftDrop.`,
    };
  } else if (payment.status === 'pending' && cancelled) {
    view = { icon: 'x', tone: 'bad', title: 'Payment cancelled', text: 'No money was taken. Your items stay reserved until their timer runs out – you can try again from your cart.' };
  } else if (payment.status === 'pending') {
    view = waiting
      ? { icon: null, tone: 'wait', title: 'Confirming your payment…', text: 'This usually takes a few seconds. Please keep this page open.' }
      : { icon: 'clock', tone: 'wait', title: 'Still waiting for the bank', text: 'We have not heard back from PayHere yet. If money was taken, your order is confirmed automatically as soon as we hear – check My Orders in a few minutes.' };
  } else if (payment.status === 'chargedback') {
    view = { icon: 'x', tone: 'bad', title: 'Payment reversed', text: 'This card payment was reversed by the bank, so the order was cancelled. Please contact us if this is a mistake.' };
  } else {
    view = { icon: 'x', tone: 'bad', title: payment.status === 'cancelled' ? 'Payment cancelled' : 'Payment failed', text: (payment.statusMessage ? payment.statusMessage + '. ' : '') + 'No order was placed. Your items stay reserved until their timer runs out, so you can try again.' };
  }

  return (
    <main className="container page">
      <div className="result">
        <div className={'result-icon ' + view.tone}>{view.icon ? <Icon name={view.icon} size={38} strokeWidth={2.4} /> : <div className="spinner" />}</div>
        <h1>{view.title}</h1>
        <p>{view.text}</p>

        {refunds.length > 0 && (
          <div className="info-box warn" style={{ textAlign: 'left', marginBottom: 16 }}>
            <Icon name="alert" size={20} />
            <div>
              <strong>{refunds.length} item(s) could not be filled</strong>
              Your reservation ran out and the item sold out before your payment arrived. You will get a full refund for it – our team has been notified.
            </div>
          </div>
        )}

        <div className="card card-pad">
          <div className="row-between" style={{ marginBottom: 6 }}>
            <strong>{payment.method === 'cod' ? 'Cash on delivery' : 'Card payment'}</strong>
            <span className={'badge badge-' + payment.status}>{payment.status.replace(/_/g, ' ')}</span>
          </div>
          <div className="muted small">
            {formatDate(payment.createdAt)}
            {payment.cardNo && ` · ${payment.gatewayMethod || 'Card'} ${payment.cardNo.slice(-8)}`}
            {payment.gatewayRef && ` · Ref ${payment.gatewayRef}`}
          </div>
          {payment.orders.map((o) => (
            <div key={o._id} className="line-item sm">
              <Img src={o.itemImage} alt="" />
              <div className="info">
                <div className="name small">{o.itemName}</div>
                <div className="muted tiny">{orderNumber(o)}{o.variant && ` · ${o.variant}`}</div>
              </div>
              <strong className="small">{money(o.price * o.quantity)}</strong>
            </div>
          ))}
          <div className="sum-row total"><span>Total</span><span>{money(payment.amount)}</span></div>
          {payment.deliverTo?.address && (
            <div className="muted small" style={{ marginTop: 10 }}>
              <Icon name="pin" size={14} /> Delivering to {payment.deliverTo.name}, {payment.deliverTo.address}
            </div>
          )}
        </div>

        <div className="actions">
          {success ? (
            <>
              <Link to="/orders" className="btn btn-primary">View my orders</Link>
              <Link to="/deals" className="btn btn-ghost">Continue shopping</Link>
            </>
          ) : (
            <>
              <Link to="/cart" className="btn btn-primary">Back to cart</Link>
              <Link to="/orders" className="btn btn-ghost">My orders</Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
