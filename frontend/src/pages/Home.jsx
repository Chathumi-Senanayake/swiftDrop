import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useInterval } from '../hooks';
import DealCard from '../components/DealCard';
import EventCard from '../components/EventCard';
import Icon from '../components/Icon';
import Countdown from '../components/Countdown';
import SaleChips from '../components/SaleChips';
import SaleAlerts from '../components/SaleAlerts';

export default function Home() {
  const toast = useToast();
  const [deals, setDeals] = useState(null);
  const [events, setEvents] = useState([]);

  // quiet = background refresh: a failed one is not worth a pop-up every 10 seconds
  const load = useCallback(async (quiet) => {
    try {
      const [{ items }, { events }] = await Promise.all([api('/items?status=live&limit=30'), api('/events')]);
      setDeals(items);
      setEvents(events);
    } catch (err) {
      if (!quiet) toast(err.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);
  useInterval(() => load(true), 10000); // keep stock numbers fresh

  const upcoming = events.filter((e) => e.status === 'locked').slice(0, 3);
  const open = events.filter((e) => e.status === 'live' || e.status === 'locked');
  // "Ending soon" band: the live sale with a timer that ends first, and up to 4 of its products
  const ending = events.filter((e) => e.status === 'live' && e.endsAt).sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt))[0];
  const endingItems = ending ? (deals || []).filter((i) => i.event._id === ending._id).slice(0, 4) : [];
  // 10 = two full rows on a wide screen (the ending-soon band may repeat a few of them on purpose)
  const gridDeals = deals && deals.slice(0, 10);

  return (
    <main className="container">
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-text">
          <div className="kicker">Sri Lanka's flash sale destination</div>
          <h1>
            Great finds.
            <br />
            <span className="gold-text">Gone fast.</span>
          </h1>
          <p>
            Top brands. Unbeatable prices. Limited time only.
            <br />
            <span>Discover new deals every day.</span>
          </p>
          <Link to="/deals" className="btn btn-primary btn-lg">
            Explore live deals <Icon name="arrowRight" size={18} />
          </Link>
          <div className="trust-row">
            <div className="trust"><Icon name="truck" size={24} /> Islandwide<br />delivery</div>
            <div className="trust"><Icon name="shield" size={24} /> Secure payments<br />or cash on delivery</div>
            <div className="trust"><Icon name="tag" size={24} /> New deals<br />every day</div>
          </div>
        </div>
        {/* The right side shows the banner picture (the section background) and opens the deals */}
        <Link to="/deals" className="hero-art" aria-label="Shop the flash sale" />
      </section>

      <SaleChips events={open} />

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Live flash deals</h2>
            <p>Limited time offers. Once they're gone, they're gone!</p>
          </div>
          <Link to="/deals" className="btn btn-ghost">
            View all deals <Icon name="arrowRight" size={16} />
          </Link>
        </div>
        {deals === null && (
          <div className="grid grid-4">
            {[1, 2, 3, 4].map((n) => <div key={n} className="skeleton" style={{ height: 380 }} />)}
          </div>
        )}
        {deals?.length === 0 && (
          <div className="card empty">
            <Icon name="clock" size={44} />
            <h2>No live deals right now</h2>
            <p>The next sale is on its way – check the upcoming sales below.</p>
          </div>
        )}
        {gridDeals?.length > 0 && (
          <div className="grid grid-4">
            {gridDeals.map((item) => <DealCard key={item._id} item={item} event={item.event} onCountdownEnd={load} />)}
          </div>
        )}
      </section>

      {endingItems.length > 0 && (
        <section className="ending-band">
          <div className="ending-head">
            <div>
              <div className="kicker">⏰ Last chance</div>
              <h2>{ending.name} ends soon</h2>
              <p>Grab these before the timer hits zero.</p>
            </div>
            <div className="ending-timer">
              <Countdown target={ending.endsAt} onEnd={load} className="lg" />
              <Link to={'/events/' + ending._id} className="btn btn-light btn-sm">See the whole sale <Icon name="arrowRight" size={16} /></Link>
            </div>
          </div>
          <div className="grid grid-4">
            {endingItems.map((item) => <DealCard key={item._id} item={item} event={item.event} onCountdownEnd={load} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h2>Coming up next</h2>
              <p>Set a reminder – these sales unlock soon.</p>
            </div>
            <Link to="/events?tab=locked" className="btn btn-ghost">
              All upcoming <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <div className="grid grid-3">
            {upcoming.map((e) => <EventCard key={e._id} event={e} onCountdownEnd={load} />)}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>How flash sales work</h2>
        </div>
        <div className="how">
          <div className="card"><div className="n">1</div><h3>Catch the drop</h3><p>Sales unlock at a set time with limited stock. Watch the countdown.</p></div>
          <div className="card"><div className="n">2</div><h3>Add to cart</h3><p>Adding an item reserves it just for you for a few minutes.</p></div>
          <div className="card"><div className="n">3</div><h3>Pay securely</h3><p>Pay by Visa, Mastercard or Amex through PayHere, or cash on delivery.</p></div>
          <div className="card"><div className="n">4</div><h3>We deliver</h3><p>Your parcel is delivered to your door, anywhere in Sri Lanka.</p></div>
        </div>
      </section>

      <SaleAlerts />
    </main>
  );
}
