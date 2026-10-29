// Scrolling strip above the navbar: live sale timers, upcoming sales and shop promises. Pauses on hover.
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useInterval } from '../hooks';
import Countdown from './Countdown';

const PROMISES = ['Cash on delivery islandwide', 'Secure card payments by PayHere', '1 per customer – fair for everyone', 'New deals every day'];

export default function TickerBar() {
  const [events, setEvents] = useState([]);

  const load = useCallback(async () => {
    try {
      setEvents((await api('/events')).events.filter((e) => e.status === 'live' || e.status === 'locked'));
    } catch {
      // the strip still shows the shop promises
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useInterval(load, 60000);

  const entries = [
    ...events.map((e) => (
      <Link to={'/events/' + e._id}>
        {e.status === 'live' ? '⚡' : '🔒'} <strong>{e.name}</strong>{' '}
        {e.status === 'live'
          ? e.endsAt ? <>ends in <Countdown target={e.endsAt} variant="text" /></> : 'is live now'
          : <>opens in <Countdown target={e.goLiveAt} variant="text" /></>}
      </Link>
    )),
    ...PROMISES.map((p) => <span>✦ {p}</span>),
  ];

  // The list is shown twice so the scroll loops without a gap
  return (
    <div className="ticker" aria-label="Sale news">
      <div className="ticker-track" style={{ animationDuration: entries.length * 7 + 's' }}>
        {[0, 1].map((copy) => (
          <Fragment key={copy}>
            {entries.map((el, i) => <div className="ticker-item" key={i} aria-hidden={copy === 1}>{el}</div>)}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
