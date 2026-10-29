import { Link } from 'react-router-dom';
import Img from './Img';
import Icon from './Icon';
import StatusBadge from './StatusBadge';
import { TimerPill } from './DealCard';
import { formatDate } from '../utils';

// One flash sale (event): cover, status, name, timer and a link to its products
export default function EventCard({ event, onCountdownEnd }) {
  const locked = event.status === 'locked';
  return (
    <Link to={'/events/' + event._id} className="card event-card">
      <div className="thumb">
        <Img src={event.coverImage} alt={event.name} />
        <StatusBadge status={event.status} />
      </div>
      <div className="body">
        <h3>{event.name}</h3>
        {event.description && <p>{event.description}</p>}
        <div className="meta">
          <span className="muted small">
            {event.itemCount} items · {locked ? 'Starts' : 'Started'} {formatDate(event.goLiveAt)}
          </span>
          {(event.status === 'live' || locked) && <TimerPill event={event} onEnd={onCountdownEnd} />}
          {!locked && event.status !== 'live' && (
            <span className="text-link small row" style={{ gap: 4 }}>
              View <Icon name="arrowRight" size={14} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
