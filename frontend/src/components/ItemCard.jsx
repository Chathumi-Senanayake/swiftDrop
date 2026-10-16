import Img from './Img';
import { money, variantImage } from '../utils';

// One product on the event page: picture, price, live stock bar and the Buy button.
// Clicking the picture, name or "View details" opens the details popup.
export default function ItemCard({ item, eventStatus, myOrder, busy, isAdmin, onBuy, onPay, onDetails }) {
  const percent = (item.stock / item.quantity) * 100;
  const hasVariants = item.variants?.length > 0;

  function button() {
    const btn = (text, cls, props = {}) => (
      <button className={'btn btn-block ' + cls} disabled={!props.onClick} {...props}>
        {text}
      </button>
    );
    if (isAdmin) return btn('Admins cannot buy', 'btn-ghost');
    if (busy) return btn('Reserving…', 'btn-primary');
    if (myOrder?.status === 'confirmed') return btn('✓ Purchased', 'btn-success');
    if (myOrder?.status === 'reserved') return btn('Complete Payment', 'btn-outline', { onClick: onPay });
    if (eventStatus === 'locked') return btn('🔒 Opens Soon', 'btn-ghost');
    if (eventStatus === 'closed') return btn('Event Ended', 'btn-ghost');
    if (item.stock === 0) return btn('Sold Out', 'btn-danger');
    // Items with varieties: choose one in the details popup first
    return btn('Buy Now', 'btn-primary', { onClick: hasVariants ? onDetails : () => onBuy('') });
  }

  return (
    <div className="card item-card">
      <div className="thumb clickable" onClick={onDetails}>
        {/* After buying, show the colour this customer chose */}
        <Img src={variantImage(item, myOrder?.variant)} alt={item.name} />
        {item.stock === 0 && <div className="soldout-overlay">SOLD OUT</div>}
      </div>
      <div className="body">
        <h3 className="clickable" onClick={onDetails}>
          {item.name}
        </h3>
        <div className="price">{money(item.price)}</div>
        {hasVariants && <div className="muted small">{item.variants.length} varieties</div>}
        <div className={'stock-bar' + (percent < 20 ? ' low' : '')}>
          <div style={{ width: percent + '%' }} />
        </div>
        <div className="muted small">
          {eventStatus === 'locked' ? `${item.quantity} units available at launch` : `${item.stock} left of ${item.quantity}`}
        </div>
        <button className="link-btn" onClick={onDetails}>
          View details →
        </button>
        {button()}
      </div>
    </div>
  );
}
