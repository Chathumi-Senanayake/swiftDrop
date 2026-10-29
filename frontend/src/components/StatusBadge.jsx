const STATUS_TEXT = { live: 'Live now', locked: 'Upcoming', soldout: 'Sold out', closed: 'Ended' };

export default function StatusBadge({ status }) {
  return (
    <span className={'badge badge-' + status}>
      {status === 'live' && <span className="live-dot" style={{ background: '#fff' }} />}
      {STATUS_TEXT[status] || status}
    </span>
  );
}
