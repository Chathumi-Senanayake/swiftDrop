// Product page: gallery, price, sale timer, live stock, variety picker, Buy now / Add to cart.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { useInterval } from '../hooks';
import Countdown from '../components/Countdown';
import DealCard from '../components/DealCard';
import Icon from '../components/Icon';
import Img from '../components/Img';
import { colourOf, discountPercent, formatDate, galleryImages, money, stockPercent, stockText, variantImage } from '../utils';

export default function Product() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { orderFor, reserve } = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [variant, setVariant] = useState('');
  const [image, setImage] = useState('');
  const [zoom, setZoom] = useState(false);
  const [busy, setBusy] = useState(''); // 'buy' | 'cart' while the server reserves
  const [hint, setHint] = useState('');

  useEffect(() => {
    setItem(null);
    setError('');
    (async () => {
      try {
        const data = await api('/items/' + id);
        setItem(data.item);
        setEvent(data.event);
        setVariant(data.item.variants?.length === 1 ? data.item.variants[0] : '');
        setImage(data.item.image);
        document.title = `SwiftDrop – ${data.item.name}`;
      } catch (err) {
        setError(err.message);
      }
    })();
    return () => (document.title = 'SwiftDrop – Flash Deals');
  }, [id]);

  // Live stock + sale status while the page is open
  const refresh = useCallback(async () => {
    if (!event) return;
    try {
      const fresh = await api(`/events/${event._id}/stock`);
      setEvent((e) => ({ ...e, status: fresh.status, items: e.items.map((i) => ({ ...i, ...fresh.items.find((f) => f._id === i._id) })) }));
      const mine = fresh.items.find((f) => f._id === id);
      if (mine) setItem((i) => ({ ...i, ...mine }));
    } catch {}
  }, [event?._id, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useInterval(refresh, event && event.status !== 'closed' ? 3000 : null);

  if (error)
    return (
      <main className="container page">
        <div className="card empty">
          <Icon name="alert" size={44} />
          <h2>{error}</h2>
          <Link to="/deals" className="btn btn-primary">Browse deals</Link>
        </div>
      </main>
    );
  if (!item) return <main className="container page"><div className="skeleton" style={{ height: 520 }} /></main>;

  const myOrder = orderFor(item._id);
  const variants = item.variants || [];
  const images = galleryImages(item);
  const off = discountPercent(item);
  const soldOut = item.stock === 0 && event.status !== 'locked';
  const low = event.status !== 'locked' && stockPercent(item) < 20;
  const canPick = !myOrder && !isAdmin;
  const hasVariantImages = (item.variantImages || []).some(Boolean);
  const shownVariant = myOrder?.variant || variant;
  const saved = wishlist.has(item._id);

  function pick(v) {
    setVariant(v);
    setHint('');
    setImage(variantImage(item, v));
  }

  async function buy(goToCheckout) {
    if (variants.length && !variant) return setHint('Please choose an option first.');
    setBusy(goToCheckout ? 'buy' : 'cart');
    const order = await reserve(item._id, variant);
    setBusy('');
    if (!order) return refresh();
    if (goToCheckout) navigate('/checkout?orders=' + order._id);
    else toast(`Added to your cart. It's reserved for you – check out before the timer runs out.`, 'success');
  }

  function actions() {
    if (isAdmin) return <button className="btn btn-ghost btn-lg btn-block" disabled>Admins cannot buy</button>;
    if (myOrder?.status === 'confirmed')
      return (
        <div className="buy-row">
          <button className="btn btn-success btn-lg" disabled><Icon name="check" size={18} /> Purchased</button>
          <Link to="/orders" className="btn btn-outline btn-lg">View my orders</Link>
        </div>
      );
    if (myOrder?.status === 'reserved')
      return (
        <div className="buy-row">
          <Link to={'/checkout?orders=' + myOrder._id} className="btn btn-primary btn-lg">Checkout now</Link>
          <Link to="/cart" className="btn btn-outline btn-lg"><Icon name="cart" size={18} /> In your cart</Link>
        </div>
      );
    if (event.status === 'locked') return <button className="btn btn-ghost btn-lg btn-block" disabled><Icon name="lock" size={18} /> Buying opens when the sale starts</button>;
    if (event.status === 'closed') return <button className="btn btn-ghost btn-lg btn-block" disabled>This sale has ended</button>;
    if (soldOut) return <button className="btn btn-ghost btn-lg btn-block" disabled>Sold out</button>;
    return (
      <div className="buy-row">
        <button className="btn btn-primary btn-lg" disabled={!!busy} onClick={() => buy(true)}>
          {busy === 'buy' ? 'Reserving…' : 'Buy now'}
        </button>
        <button className="btn btn-outline btn-lg" disabled={!!busy} onClick={() => buy(false)}>
          <Icon name="cart" size={18} /> {busy === 'cart' ? 'Adding…' : 'Add to cart'}
        </button>
      </div>
    );
  }

  const others = event.items.filter((i) => i._id !== item._id).slice(0, 4);

  return (
    <main className="container">
      <nav className="crumbs">
        <Link to="/">Home</Link>
        <Icon name="chevronRight" size={14} />
        <Link to={'/events/' + event._id}>{event.name}</Link>
        <Icon name="chevronRight" size={14} />
        <span>{item.brand ? `${item.brand} ${item.name}` : item.name}</span>
      </nav>

      <div className="product">
        <div className={'gallery' + (images.length < 2 ? ' single' : '')}>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src) => (
                <button
                  key={src}
                  className={src === image ? 'active' : ''}
                  onClick={() => {
                    setImage(src);
                    // A variety photo also selects that variety
                    const v = variants[(item.variantImages || []).indexOf(src)];
                    if (v && canPick) pick(v);
                  }}
                  aria-label="Show photo"
                >
                  <Img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="main-img">
            <Img key={image} src={image || item.image} alt={item.name} />
            {soldOut && <div className="soldout-overlay"><span>SOLD OUT</span></div>}
            <button className="zoom" onClick={() => setZoom(true)} aria-label="Enlarge photo">
              <Icon name="expand" size={18} />
            </button>
          </div>
        </div>

        <div>
          <div className="row-between" style={{ alignItems: 'flex-start' }}>
            <div>
              {item.brand && <div className="p-brand">{item.brand}</div>}
              <h1 className="p-title">{item.name}</h1>
            </div>
            <button className="icon-btn" onClick={() => wishlist.toggle(item)} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} title={saved ? 'Saved' : 'Save for later'} style={{ color: saved ? 'var(--primary)' : undefined }}>
              <Icon name="heart" size={24} strokeWidth={saved ? 2.4 : 1.8} />
            </button>
          </div>
          <div className="p-sub">
            <Link to={'/events/' + event._id} className="text-link">{event.name}</Link>
            <span>·</span>
            <span>Limit 1 per customer</span>
          </div>

          <div className="p-price">
            <span className="price">{money(item.price)}</span>
            {item.originalPrice > item.price && <span className="price-old">{money(item.originalPrice)}</span>}
            {off && <span className="discount">-{off}%</span>}
            {off && <span className="small" style={{ color: 'var(--green)', fontWeight: 600 }}>You save {money(item.originalPrice - item.price)}</span>}
          </div>

          {event.status === 'live' && event.endsAt && (
            <div className="sale-box">
              <div className="label"><Icon name="clock" size={26} /> Sale ends in</div>
              <Countdown target={event.endsAt} onEnd={refresh} />
            </div>
          )}
          {event.status === 'live' && !event.endsAt && (
            <div className="sale-box"><div className="label"><span className="live-dot" /> Live now – while stocks last</div></div>
          )}
          {event.status === 'locked' && (
            <div className="sale-box blue">
              <div className="label"><Icon name="lock" size={24} /> Sale starts in</div>
              <Countdown target={event.goLiveAt} onEnd={refresh} />
            </div>
          )}
          {(event.status === 'closed' || event.status === 'soldout') && (
            <div className="sale-box grey"><div className="label">{event.status === 'closed' ? 'This sale has ended' : 'Every item in this sale has sold out'}</div></div>
          )}

          <div className="p-stock">
            <div className={'stock-bar' + (low ? ' low' : '')}>
              <div style={{ width: (event.status === 'locked' ? 100 : stockPercent(item)) + '%' }} />
            </div>
            <div className={'stock-text' + (low && !soldOut ? ' low' : '')}>{stockText(item, event.status)}</div>
          </div>

          {variants.length > 0 && (
            <>
              <div className="opt-label">
                Option: <span>{shownVariant || 'choose one'}</span>
              </div>
              <div className="swatches">
                {variants.map((v) => {
                  const active = v === shownVariant;
                  const colour = colourOf(v);
                  if (hasVariantImages || colour)
                    return (
                      <button key={v} type="button" className={'swatch' + (active ? ' active' : '')} disabled={!canPick} onClick={() => pick(v)} title={v} aria-label={v} aria-pressed={active}>
                        {hasVariantImages && item.variantImages[variants.indexOf(v)] ? <Img src={variantImage(item, v)} alt="" /> : <i style={{ background: colour || '#ddd' }} />}
                      </button>
                    );
                  return (
                    <button key={v} type="button" className={'opt-chip' + (active ? ' active' : '')} disabled={!canPick} onClick={() => pick(v)} aria-pressed={active}>
                      {v}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="qty-row">
            <div className="opt-label">Quantity</div>
            <div className="stepper" title="Flash sale items are limited to 1 per customer">
              <button disabled aria-label="Less"><Icon name="minus" size={16} /></button>
              <span>1</span>
              <button disabled aria-label="More"><Icon name="plus" size={16} /></button>
            </div>
            <span className="muted small">Limit 1 per customer so more people get the deal</span>
          </div>

          {actions()}
          {hint && <div className="form-hint">{hint}</div>}

          <div className="perks">
            <div className="perk"><Icon name="truck" size={22} /><div><strong>Islandwide delivery</strong>To your saved address</div></div>
            <div className="perk"><Icon name="cash" size={22} /><div><strong>Cash on delivery</strong>Pay when it arrives</div></div>
            <div className="perk"><Icon name="shield" size={22} /><div><strong>Secure payments</strong>Visa, Mastercard, Amex</div></div>
          </div>

          <div className="info-box">
            <Icon name="info" size={20} />
            <div>
              <strong>How do flash sales work?</strong>
              Prices are only for a limited time. Adding an item to your cart reserves it for a few minutes – pay before the timer runs out
              or it goes back on sale. The deal ends when the timer reaches zero or the stock sells out, whichever comes first.
              {event.status === 'locked' && <> This sale opens {formatDate(event.goLiveAt)}.</>}
            </div>
          </div>
        </div>
      </div>

      <section className="desc">
        <div>
          <h2>About this product</h2>
          <div className="desc-text">{item.description || 'No description has been added for this product yet.'}</div>
        </div>
        {others.length > 0 && (
          <div>
            <h2>More from this sale</h2>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {others.map((i) => <DealCard key={i._id} item={i} event={event} onCountdownEnd={refresh} />)}
            </div>
          </div>
        )}
      </section>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(false)} role="dialog" aria-label="Photo">
          <img src={image || item.image} alt={item.name} />
        </div>
      )}
    </main>
  );
}
