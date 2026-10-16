import { useNavigate } from 'react-router-dom';
import Img from './Img';
import StatusBadge from './StatusBadge';
import Countdown from './Countdown';
import { formatDate } from '../utils';

export default function EventCard({ event, onCountdownEnd }) {
  const navigate = useNavigate();
  const locked = event.status === 'locked';
  return (
    <div className="card event-card" onClick={() => navigate('/events/' + event._id)}>
      <div className="thumb">
        <Img src={event.coverImage} alt={event.name} />
        <StatusBadge status={event.status} />
        {locked && <Countdown target={event.goLiveAt} onEnd={onCountdownEnd} />}
      </div>
      <div className="body">
        <h3>{event.name}</h3>
        <div className="muted small">
          {event.itemCount} items • {locked ? 'Starts' : 'Started'} {formatDate(event.goLiveAt)}
        </div>
      </div>
    </div>
  );
}
