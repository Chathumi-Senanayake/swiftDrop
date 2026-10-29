// Small formatting helpers shared by many components.

export const PLACEHOLDER = '/img/placeholder.svg';

// Sri Lankan Rupees, e.g. Rs. 18,990  (cents only when there are some: Rs. 18,990.50)
export function money(n) {
  const value = Number(n || 0);
  const cents = Math.round(value * 100) % 100 !== 0;
  return 'Rs. ' + value.toLocaleString('en-LK', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

export function formatDate(d) {
  return new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function orderNumber(order) {
  return '#SD' + order._id.slice(-8).toUpperCase();
}

export function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// Photo for the chosen variety (falls back to the item's main photo)
export function variantImage(item, variant) {
  const i = (item.variants || []).indexOf(variant);
  return (i >= 0 && item.variantImages?.[i]) || item.image;
}

export const isEnded = (status) => status === 'closed' || status === 'soldout';

// -40 for "40% off", or null when the item has no normal price
export function discountPercent(item) {
  if (!item.originalPrice || item.originalPrice <= item.price) return null;
  return Math.round((1 - item.price / item.originalPrice) * 100);
}

// Remaining stock as a % of the starting quantity (drives the stock bar)
export const stockPercent = (item) => (item.quantity ? (item.stock / item.quantity) * 100 : 0);

// "12 of 50 remaining" / "Only 3 left!" / "100 available at launch"
export function stockText(item, eventStatus) {
  if (eventStatus === 'locked') return `${item.quantity} available at launch`;
  if (item.stock === 0) return 'Sold out';
  if (item.stock <= 5) return `Only ${item.stock} left!`;
  return `${item.stock} of ${item.quantity} remaining`;
}

// Common colour names -> a swatch colour (varieties that aren't colours show as text chips)
const COLOURS = {
  black: '#1d1f24', white: '#f7f7f5', silver: '#c9ccd1', grey: '#8d9198', gray: '#8d9198', champagne: '#e6d3b3',
  beige: '#e3d3bd', gold: '#d4af37', blue: '#2f6fe4', navy: '#1f2f56', red: '#d93a3a', green: '#2f8f4e',
  purple: '#7b4fc9', pink: '#f08bb0', brown: '#7a5134', tortoise: '#6b4423', orange: '#f05a28', yellow: '#f2c230',
};
export const colourOf = (variant) => COLOURS[String(variant).trim().toLowerCase()] || null;

// Unique photos of an item: main photo first, then the variety photos
export function galleryImages(item) {
  return [...new Set([item.image, ...(item.variantImages || [])].filter(Boolean))];
}

export const PAYMENT_LABEL = { card: 'Paid by card', cod: 'Cash on delivery' };
