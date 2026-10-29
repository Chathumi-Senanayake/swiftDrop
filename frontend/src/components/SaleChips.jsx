// "Shop by sale" row: one chip per live / upcoming sale, with the sale's cover photo
import { Link } from 'react-router-dom';
import Img from './Img';
import { formatDate } from '../utils';

export default function SaleChips({ events }) {
  if (!events.length) return null;
  return (
    <section className="sale-chips" aria-label="Shop by sale">
      {events.map((e) => (
        <Link key={e._id} to={'/events/' + e._id} className={'sale-chip ' + e.status}>
          <span className="sale-chip-icon"><Img src={e.coverImage} alt="" /></span>
          <span className="sale-chip-name">{e.name}</span>
          <span className="sale-chip-when">{e.status === 'live' ? <><span className="live-dot" /> Live now</> : 'Opens ' + formatDate(e.goLiveAt)}</span>
        </Link>
      ))}
    </section>
  );
}
