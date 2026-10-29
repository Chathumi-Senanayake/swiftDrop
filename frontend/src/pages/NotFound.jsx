import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <main className="container page">
      <div className="card empty">
        <Icon name="search" size={48} />
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist – but the deals do.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </main>
  );
}
