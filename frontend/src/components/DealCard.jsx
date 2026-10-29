// One product tile: sale timer, discount, photo, name, brand, prices, stock bar and a quick "add to cart" button.
// `event` = { status, endsAt, goLiveAt } of the sale the item belongs to.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Img from './Img';
import Icon from './Icon';
import Countdown from './Countdown';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { discountPercent, money, stockPercent, stockText, variantImage } from '../utils';

export function TimerPill({ event, onEnd }) {
  if (event.status === 'locked') {
    return (
      <span className="timer-pill blue">
        <Icon name="lock" size={14} strokeWidth={2.2} /> <Countdown target={event.goLiveAt} variant="text" onEnd={onEnd} />
      </span>
    );
  }
  if (event.status === 'closed') return <span className="timer-pill grey">Sale ended</span>;
  if (event.endsAt) {
    return (
      <span className="timer-pill">
        <Icon name="clock" size={14} strokeWidth={2.2} /> <Countdown target={event.endsAt} variant="text" onEnd={onEnd} />
      </span>
    );
  }
  return (
    <span className="timer-pill">
      <span className="live-dot" /> Live now
    </span>
  );
}

export default function DealCard({ item, event, onCountdownEnd }) {
  const { isAdmin } = useAuth();
  const { orderFor, reserve } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const link = '/items/' + item._id;
  const myOrder = orderFor(item._id);
  const off = discountPercent(item);
  const soldOut = item.stock === 0 && event.status !== 'locked';
  const percent = stockPercent(item);
  const low = event.status !== 'locked' && percent < 20;
  // Urgency tag on the photo, from the real stock numbers
  const hot = event.status === 'live' && !soldOut && (item.stock <= 5 ? '⚡ Almost gone' : percent <= 50 ? '🔥 Selling fast' : '');

  async function quickAdd() {
    if (myOrder) return navigate(myOrder.status === 'reserved' ? '/cart' : '/orders');
    if (item.variants?.length) return navigate(link); // choose a colour / size first
    setBusy(true);
    const order = await reserve(item._id);
    setBusy(false);
    if (order) toast(`${item.name} is in your cart and reserved for you.`, 'success');
  }

  const canBuy = event.status === 'live' && !soldOut && !isAdmin;
  const title = myOrder
    ? myOrder.status === 'reserved' ? 'In your cart' : 'Purchased'
    : canBuy ? (item.variants?.length ? 'Choose an option' : 'Add to cart') : 'Not available';

  return (
    <div className="deal-card">
      <Link to={link} className="thumb">
        <Img src={variantImage(item, myOrder?.variant)} alt={item.name} />
        <TimerPill event={event} onEnd={onCountdownEnd} />
        {off && <span className="discount">-{off}%</span>}
        {hot && <span className="hot-tag">{hot}</span>}
        {soldOut && <div className="soldout-overlay"><span>SOLD OUT</span></div>}
      </Link>
      <div className="body">
        <Link to={link} className="name">{item.name}</Link>
        <div className="brand">{item.brand}</div>
        <div className="price-row">
          <span className="price">{money(item.price)}</span>
          {item.originalPrice > item.price && <span className="price-old">{money(item.originalPrice)}</span>}
        </div>
        <div className="foot">
          <div className="grow">
            <div className={'stock-bar' + (low ? ' low' : '')}>
              <div style={{ width: (event.status === 'locked' ? 100 : percent) + '%' }} />
            </div>
            <div className={'stock-text' + (low && !soldOut ? ' low' : '')}>{stockText(item, event.status)}</div>
          </div>
          <button
            className={'cart-btn' + (myOrder ? ' done' : '')}
            title={title}
            aria-label={title}
            disabled={busy || (!myOrder && !canBuy)}
            onClick={quickAdd}
          >
            <Icon name={myOrder ? 'check' : 'cart'} size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
