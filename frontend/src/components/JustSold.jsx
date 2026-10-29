// Small "just bought" card in the bottom-left corner, built from real recent purchases (item + town, never the buyer)
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useInterval } from '../hooks';
import Icon from './Icon';
import Img from './Img';

const HIDDEN_ON = ['/login', '/register', '/checkout', '/payment', '/admin'];
const SHOW_MS = 6000;
const GAP_MS = 22000;

function timeAgo(date) {
  const min = Math.round((Date.now() - new Date(date)) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 60 * 24) return `${Math.round(min / 60)} h ago`;
  return `${Math.round(min / 1440)} d ago`;
}

function wasClosed() {
  try {
    return sessionStorage.getItem('sd_justsold_off') === '1';
  } catch {
    return false;
  }
}

export default function JustSold() {
  const { pathname } = useLocation();
  const [sales, setSales] = useState([]);
  const [index, setIndex] = useState(-1); // -1 = hidden
  const [off, setOff] = useState(wasClosed);

  const load = useCallback(async () => {
    try {
      setSales((await api('/items/recent-sales')).sales);
    } catch {
      // no pop-up then
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useInterval(load, 120000);

  // Show one sale, hide it, wait, show the next one
  useEffect(() => {
    if (off || !sales.length) return;
    let next = 0;
    let timer;
    const show = () => {
      setIndex(next % sales.length);
      next++;
      timer = setTimeout(hide, SHOW_MS);
    };
    const hide = () => {
      setIndex(-1);
      timer = setTimeout(show, GAP_MS);
    };
    timer = setTimeout(show, 8000);
    return () => clearTimeout(timer);
  }, [sales, off]);

  function close() {
    setOff(true);
    try {
      sessionStorage.setItem('sd_justsold_off', '1');
    } catch {
      // fine, it stays closed until the page reloads
    }
  }

  const sale = sales[index];
  if (off || !sale || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="just-sold" key={index} role="status">
      <Link to={'/items/' + sale.itemId} className="just-sold-link">
        <Img src={sale.itemImage} alt="" />
        <div>
          <div className="tiny muted">Someone {sale.town ? `in ${sale.town} ` : ''}just bought</div>
          <div className="strong just-sold-name">{sale.itemName}</div>
          <div className="tiny just-sold-time"><Icon name="check" size={12} strokeWidth={3} /> {timeAgo(sale.at)} · verified purchase</div>
        </div>
      </Link>
      <button className="just-sold-x" onClick={close} aria-label="Stop showing recent purchases"><Icon name="x" size={14} /></button>
    </div>
  );
}
