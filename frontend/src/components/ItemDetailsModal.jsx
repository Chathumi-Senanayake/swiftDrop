// Item details popup: photo, description and varieties. Anyone can look at it before the event starts,
// but the Buy button only works while the event is live.
import { useState } from 'react';
import Img from './Img';
import Modal from './Modal';
import Countdown from './Countdown';
import { formatDate, money, variantImage } from '../utils';

export default function ItemDetailsModal({ item, event, myOrder, isAdmin, busy, onBuy, onPay, onClose }) {
  const variants = item.variants || [];
  const [variant, setVariant] = useState(myOrder?.variant || (variants.length === 1 ? variants[0] : ''));

  function action() {
    const btn = (text, cls, onClick) => (
      <button className={'btn btn-block ' + cls} disabled={!onClick} onClick={onClick}>
        {text}
      </button>
    );
    if (isAdmin) return btn('Admins cannot buy', 'btn-ghost');
    if (busy) return btn('Reserving…', 'btn-primary');
    if (myOrder?.status === 'confirmed') return btn('✓ Purchased', 'btn-success');
    if (myOrder?.status === 'reserved') return btn('Complete Payment', 'btn-outline', onPay);
    if (event.status === 'locked') return btn('🔒 Buying opens when the event starts', 'btn-ghost');
    if (event.status === 'closed') return btn('Event Ended', 'btn-ghost');
    if (item.stock === 0) return btn('Sold Out', 'btn-danger');
    if (variants.length && !variant) return btn('Choose a variety to buy', 'btn-primary');
    return btn('Buy Now', 'btn-primary', () => onBuy(variant));
  }

  // The variety can only be changed while nothing is reserved / bought yet
  const canPick = !myOrder && !isAdmin;
  const hasVariantImages = (item.variantImages || []).some(Boolean);

  return (
    <Modal wide>
      <button className="modal-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <div className="details">
        <div className="details-img">
          {/* The photo follows the chosen variety, e.g. pick White -> see the white one */}
          <Img key={variantImage(item, variant)} src={variantImage(item, variant)} alt={variant ? `${item.name} – ${variant}` : item.name} />
        </div>
        <div className="details-info">
          <h2>{item.name}</h2>
          <div className="price">{money(item.price)}</div>
          <p className="muted details-desc">{item.description || 'No description has been added for this item yet.'}</p>

          {variants.length > 0 && (
            <div className="form-group">
              <label>{canPick ? 'Choose a variety' : 'Varieties'}</label>
              <div className="chip-select">
                {variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={'chip' + (v === variant ? ' active' : '')}
                    disabled={!canPick}
                    onClick={() => setVariant(v)}
                  >
                    {hasVariantImages && <Img src={variantImage(item, v)} alt="" className="chip-thumb" />}
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="muted small" style={{ marginBottom: 12 }}>
            {event.status === 'locked'
              ? `${item.quantity} units available at launch`
              : `${item.stock} left of ${item.quantity}`}
            {myOrder?.variant && ` · You chose: ${myOrder.variant}`}
          </div>

          {event.status === 'locked' && (
            <div style={{ marginBottom: 12 }}>
              <div className="muted small" style={{ marginBottom: 6 }}>
                Sale opens {formatDate(event.goLiveAt)}
              </div>
              <Countdown target={event.goLiveAt} />
            </div>
          )}

          {action()}
        </div>
      </div>
    </Modal>
  );
}
