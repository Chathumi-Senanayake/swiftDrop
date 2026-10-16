import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import Img from '../components/Img';
import StatusBadge from '../components/StatusBadge';
import Countdown from '../components/Countdown';
import Tabs from '../components/Tabs';
import { formatDate, isEnded } from '../utils';

// Which events belong in each tab
const TABS = {
  all: { label: 'All', match: () => true },
  locked: { label: 'Upcoming', match: (e) => e.status === 'locked' },
  live: { label: 'Live Now', match: (e) => e.status === 'live' },
  ended: { label: 'Ended', match: (e) => isEnded(e.status) },
};

// Live first, then upcoming, then ended
const ORDER = { live: 0, locked: 1, soldout: 2, closed: 3 };

export default function Events() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'all';
  const [allEvents, setAllEvents] = useState([]);

  const load = useCallback(async () => {
    try {
      setAllEvents((await api('/events')).events);
    } catch (err) {
      toast(err.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const labels = Object.fromEntries(
    Object.entries(TABS).map(([key, t]) => [key, `${t.label} (${allEvents.filter(t.match).length})`])
  );
  const events = allEvents.filter(TABS[tab].match).sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <main className="container page">
      <h1 className="page-title">Events</h1>
      <p className="muted">Join upcoming and live flash sale events. Limited stock. No restocks.</p>

      <Tabs tabs={labels} active={tab} onChange={(key) => setParams({ tab: key })} />

      {events.length === 0 && <div className="card empty">No events here yet.</div>}
      {events.map((e) => (
        <div key={e._id} className="card event-row">
          <Img src={e.coverImage} alt={e.name} />
          <div className="info">
            <StatusBadge status={e.status} />
            <h3>{e.name}</h3>
            <div className="muted small">
              {e.itemCount} items • {e.status === 'locked' ? 'Starts' : 'Started'} {formatDate(e.goLiveAt)}
            </div>
          </div>
          {e.status === 'locked' && <Countdown target={e.goLiveAt} onEnd={load} />}
          {e.status === 'live' && (
            <span className="small">
              <span className="live-dot" />
              Selling now
            </span>
          )}
          {isEnded(e.status) ? (
            <Link className="btn btn-ghost" to={'/events/' + e._id}>
              Event Ended
            </Link>
          ) : (
            <Link className="btn btn-primary" to={'/events/' + e._id}>
              View Event →
            </Link>
          )}
        </div>
      ))}
    </main>
  );
}
