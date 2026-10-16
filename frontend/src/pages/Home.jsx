import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EventCard from '../components/EventCard';
import Img from '../components/Img';

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);

  const load = useCallback(async () => {
    try {
      setEvents((await api('/events')).events);
    } catch (err) {
      toast(err.message, 'error');
    }
  }, [toast]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const live = events.filter((e) => e.status === 'live');
  const upcoming = events.filter((e) => e.status === 'locked').slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="hero-kicker">LIMITED QUANTITY • PREMIUM IMPORTS • UNBEATABLE PRICES</div>
            <h1>
              Flash Deals.
              <br />
              <span>Real Value.</span>
            </h1>
            <p>High-quality imported goods at prices you won't find on any retail shelf. New events, limited stock, no second chances.</p>
            <Link to="/events" className="btn btn-primary">
              Explore Events →
            </Link>
          </div>
          <Img className="hero-img" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=70&auto=format&fit=crop" alt="Headphones" />
        </div>
      </section>

      <main className="container">
        {!user && (
          <div className="empty">
            <h2>Join SwiftDrop to see today's drops</h2>
            <p style={{ margin: '10px 0 20px' }}>Log in or create a free account to browse events and buy.</p>
            <Link to="/register" className="btn btn-primary">
              Create account
            </Link>{' '}
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
          </div>
        )}

        {live.length > 0 && (
          <>
            <div className="section-head">
              <h2>🔴 Live Now</h2>
              <Link to="/events?tab=live">View all →</Link>
            </div>
            <div className="grid grid-3">
              {live.map((e) => (
                <EventCard key={e._id} event={e} />
              ))}
            </div>
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <div className="section-head">
              <h2>Upcoming Events</h2>
              <Link to="/events?tab=locked">View all →</Link>
            </div>
            <div className="grid grid-3">
              {upcoming.map((e) => (
                // an event just went live -> refresh
                <EventCard key={e._id} event={e} onCountdownEnd={load} />
              ))}
            </div>
          </>
        )}
        <div style={{ height: 60 }} />
      </main>
    </>
  );
}
