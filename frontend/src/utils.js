// Small formatting helpers shared by many components.

export const PLACEHOLDER = '/img/placeholder.svg';

// Sri Lankan Rupees, e.g. Rs. 18,990.00
export function money(n) {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
