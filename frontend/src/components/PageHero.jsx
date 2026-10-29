// Bright header for list pages (Deals, Flash sales): kicker, title and text, with a big faded bolt on the right.
import Icon from './Icon';

export default function PageHero({ kicker, title, children, side }) {
  return (
    <section className="page-hero">
      <div className="page-hero-text">
        {kicker && <div className="kicker">{kicker}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
        {side}
      </div>
      <Icon name="bolt" size={220} className="page-hero-bolt" />
    </section>
  );
}
