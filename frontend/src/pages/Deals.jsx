// All live deals, or search results (/deals?q=headphones) across live and upcoming sales.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useInterval } from '../hooks';
import DealCard from '../components/DealCard';
import Icon from '../components/Icon';
import Tabs from '../components/Tabs';
import PageHero from '../components/PageHero';
import { discountPercent } from '../utils';

const SORTS = {
  ending: { label: 'Ending soon', fn: () => 0 }, // the server already returns this order
  discount: { label: 'Biggest discount', fn: (a, b) => (discountPercent(b) || 0) - (discountPercent(a) || 0) },
  low: { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  high: { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
};

export default function Deals() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [items, setItems] = useState(null);
  const [sale, setSale] = useState('all');
  const [sort, setSort] = useState('ending');

  // quiet = background refresh: a failed one is not worth a pop-up every 10 seconds
  const load = useCallback(async (quiet) => {
    try {
      const status = q ? 'all' : 'live';
      setItems((await api(`/items?status=${status}&limit=200&search=${encodeURIComponent(q)}`)).items);
    } catch (err) {
      if (!quiet) toast(err.message, 'error');
    }
  }, [q, toast]);

  useEffect(() => {
    setItems(null);
    setSale('all');
    load();
  }, [load]);
  useInterval(() => load(true), 10000);

  // One filter tab per sale that has items in the list
  const sales = useMemo(() => {
    const tabs = { all: 'All' };
    (items || []).forEach((i) => (tabs[i.event._id] = i.event.name));
    return tabs;
  }, [items]);
  const counts = useMemo(() => {
    const c = { all: items?.length || 0 };
    (items || []).forEach((i) => (c[i.event._id] = (c[i.event._id] || 0) + 1));
    return c;
  }, [items]);

  // The chosen sale may have ended since (its tab is gone) -> show everything again
  const activeSale = sales[sale] ? sale : 'all';
  const shown = (items || []).filter((i) => activeSale === 'all' || i.event._id === activeSale).sort(SORTS[sort].fn);

  return (
    <main className="container page">
      <PageHero
        kicker={q ? 'Search' : 'Up to 50% off'}
        title={q ? <>Results for “{q}”</> : 'Live flash deals'}
        side={q && <button className="btn btn-light btn-sm" onClick={() => setParams({})}>Clear search</button>}
      >
        {q ? 'Products from live and upcoming sales.' : "Limited time offers. Once they're gone, they're gone!"}
      </PageHero>

      <div className="row-between toolbar">
        <span className="muted small">{items ? `${shown.length} product${shown.length === 1 ? '' : 's'}` : 'Loading…'}</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }} aria-label="Sort">
          {Object.entries(SORTS).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
        </select>
      </div>

      {Object.keys(sales).length > 2 && <Tabs tabs={sales} active={activeSale} onChange={setSale} counts={counts} />}

      {items === null && (
        <div className="grid grid-4" style={{ marginTop: 20 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <div key={n} className="skeleton" style={{ height: 380 }} />)}
        </div>
      )}
      {items && shown.length === 0 && (
        <div className="card empty" style={{ marginTop: 20 }}>
          <Icon name="search" size={44} />
          <h2>{q ? 'Nothing found' : 'No live deals right now'}</h2>
          <p>{q ? 'Try another word, like a brand or product type.' : 'New sales unlock every day. See what is coming up.'}</p>
          <Link to="/events?tab=locked" className="btn btn-primary">See upcoming sales</Link>
        </div>
      )}
      <div className="grid grid-4" style={{ marginTop: Object.keys(sales).length > 2 ? 0 : 20 }}>
        {shown.map((item) => <DealCard key={item._id} item={item} event={item.event} onCountdownEnd={load} />)}
      </div>
    </main>
  );
}
