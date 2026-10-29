import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import EventCard from '../components/EventCard';
import Icon from '../components/Icon';
import Tabs from '../components/Tabs';
import PageHero from '../components/PageHero';
import { isEnded } from '../utils';

// Which sales belong in each tab
const TABS = {
  all: { label: 'All', match: () => true },
  live: { label: 'Live now', match: (e) => e.status === 'live' },
  locked: { label: 'Upcoming', match: (e) => e.status === 'locked' },
  ended: { label: 'Ended', match: (e) => isEnded(e.status) },
};

// Live first, then upcoming, then ended
const ORDER = { live: 0, locked: 1, soldout: 2, closed: 3 };

export default function Events() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'all';
  const [allEvents, setAllEvents] = useState(null);

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

  const list = allEvents || [];
  const labels = Object.fromEntries(Object.entries(TABS).map(([key, t]) => [key, t.label]));
  const counts = Object.fromEntries(Object.entries(TABS).map(([key, t]) => [key, list.filter(t.match).length]));
  const events = list.filter(TABS[tab].match).sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <main className="container page">
      <PageHero kicker={`${counts.live} live now · ${counts.locked} coming up`} title="Flash sales">
        Join upcoming and live flash sales. Limited stock. No restocks.
      </PageHero>

      <Tabs tabs={labels} active={tab} onChange={(key) => setParams({ tab: key })} counts={counts} />

      {allEvents && events.length === 0 && (
        <div className="card empty">
          <Icon name="calendar" size={44} />
          <h2>No sales here yet</h2>
          <p>Check back soon – new sales are added all the time.</p>
        </div>
      )}
      <div className="grid grid-3">
        {events.map((e) => <EventCard key={e._id} event={e} onCountdownEnd={load} />)}
      </div>
    </main>
  );
}
