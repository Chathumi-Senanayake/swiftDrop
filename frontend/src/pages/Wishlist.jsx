import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import Icon from '../components/Icon';
import Img from '../components/Img';
import { discountPercent, money } from '../utils';

export default function Wishlist() {
  const { items, toggle } = useWishlist();

  return (
    <main className="container page">
      <h1 className="page-title">Wishlist</h1>
      <p className="page-sub">Products you saved for later. Prices and stock may have changed – open one to see it live.</p>

      {items.length === 0 ? (
        <div className="card empty" style={{ marginTop: 20 }}>
          <Icon name="heart" size={48} />
          <h2>Nothing saved yet</h2>
          <p>Tap the heart on any product to keep it here.</p>
          <Link to="/deals" className="btn btn-primary">Browse live deals</Link>
        </div>
      ) : (
        <div className="grid grid-4" style={{ marginTop: 20 }}>
          {items.map((item) => {
            const off = discountPercent(item);
            return (
              <div key={item._id} className="deal-card">
                <Link to={'/items/' + item._id} className="thumb">
                  <Img src={item.image} alt={item.name} />
                  {off && <span className="discount">-{off}%</span>}
                </Link>
                <div className="body">
                  <Link to={'/items/' + item._id} className="name">{item.name}</Link>
                  <div className="brand">{item.brand}</div>
                  <div className="price-row">
                    <span className="price">{money(item.price)}</span>
                    {item.originalPrice > item.price && <span className="price-old">{money(item.originalPrice)}</span>}
                  </div>
                  <div className="foot">
                    <Link to={'/items/' + item._id} className="btn btn-sm btn-soft grow">View deal</Link>
                    <button className="cart-btn" onClick={() => toggle(item)} aria-label="Remove from wishlist" title="Remove">
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
