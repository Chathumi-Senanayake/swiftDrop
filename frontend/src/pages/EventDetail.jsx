// One flash sale: banner with its timer, then every product in it with live stock.
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useInterval } from '../hooks';
import StatusBadge from '../components/StatusBadge';
import Countdown from '../components/Countdown';
import DealCard from '../components/DealCard';
import Icon from '../components/Icon';
import Img from '../components/Img';
import { formatDate } from '../utils';

export default function EventDetail() {
  const { id: eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Opening another sale from the menu: forget the previous one first
    setEvent(null);
    setError('');
    (async () => {
      try {
        const { event } = await api('/events/' + eventId);
        document.title = 'SwiftDrop – ' + event.name;
        setEvent(event);
      } catch (err) {
        setError(err.message);
      }
    })();
    return () => (document.title = 'SwiftDrop – Flash Deals');
  }, [eventId]);

  // Real-time stock: ask the server for fresh numbers (no page reload)
  const refreshStock = useCallback(async () => {
    try {
      const fresh = await api(`/events/${eventId}/stock`);
      setEvent((e) => ({
        ...e,
        status: fresh.status,
        items: e.items.map((i) => ({ ...i, ...fresh.items.find((f) => f._id === i._id) })),
      }));
    } catch {}
  }, [eventId]);

  useInterval(refreshStock, event && event.status !== 'closed' ? 2000 : null);

  if (error)
    return (
      <main className="container page">
        <div className="card empty">
          <Icon name="alert" size={44} />
          <h2>{error}</h2>
          <Link to="/events" className="btn btn-primary">Back to sales</Link>
        </div>
      </main>
    );
  if (!event) return <main className="container page"><div className="skeleton" style={{ height: 280 }} /></main>;

  return (
    <main className="container">
      <nav className="crumbs">
        <Link to="/">Home</Link>
        <Icon name="chevronRight" size={14} />
        <Link to="/events">Sales</Link>
        <Icon name="chevronRight" size={14} />
        <span>{event.name}</span>
      </nav>

      <section className="banner">
        <div className="banner-text">
          <div><StatusBadge status={event.status} /></div>
          <h1>{event.name}</h1>
          {event.description && <p>{event.description}</p>}
          <div className="facts">
            <span><Icon name="box" size={16} /> {event.itemCount} products</span>
            <span><Icon name="tag" size={16} /> Limited stock, no restocks</span>
            <span><Icon name="calendar" size={16} /> {formatDate(event.goLiveAt)}</span>
          </div>
          {event.status === 'locked' && (
            <div className="banner-timer">
              <strong className="small">Goes live in</strong>
              {/* countdown reached zero -> event is now live */}
              <Countdown target={event.goLiveAt} onEnd={refreshStock} />
            </div>
          )}
          {event.status === 'live' && event.endsAt && (
            <div className="banner-timer">
              <strong className="small">Sale ends in</strong>
              <Countdown target={event.endsAt} onEnd={refreshStock} />
            </div>
          )}
          {event.status === 'soldout' && <div className="banner-timer"><strong className="small">Every item has sold out</strong></div>}
          {event.status === 'closed' && <div className="banner-timer"><strong className="small muted">This sale has ended</strong></div>}
        </div>
        <div className="banner-img">
          <Img src={event.coverImage} alt="" />
        </div>
      </section>

      <section className="section" style={{ marginTop: 36 }}>
        <div className="section-head">
          <div>
            <h2>In this sale</h2>
            <p>
              {event.status === 'live' ? (
                <><span className="live-dot" /> Stock updates in real time</>
              ) : event.status === 'locked' ? (
                'Look around now – buying opens when the countdown ends.'
              ) : (
                'This sale is over.'
              )}
            </p>
          </div>
        </div>
        <div className="grid grid-4">
          {event.items.map((item) => <DealCard key={item._id} item={item} event={event} onCountdownEnd={refreshStock} />)}
        </div>
      </section>
    </main>
  );
}
