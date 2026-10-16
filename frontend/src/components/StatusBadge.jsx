const STATUS_TEXT = { live: 'Live Now', locked: 'Upcoming', soldout: 'Sold Out', closed: 'Ended' };

export default function StatusBadge({ status }) {
  return <span className={'badge badge-' + status}>{STATUS_TEXT[status] || status}</span>;
}
