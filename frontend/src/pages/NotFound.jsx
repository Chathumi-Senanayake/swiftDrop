import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="container page">
      <div className="card empty">
        <h2>Page not found</h2>
        <p style={{ margin: '10px 0 20px' }}>The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
