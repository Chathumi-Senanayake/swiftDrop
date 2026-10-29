// Round "back to top" button that appears after scrolling down a bit
import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      className={'back-to-top' + (show ? ' show' : '')}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      tabIndex={show ? 0 : -1}
    >
      <Icon name="arrowRight" size={20} strokeWidth={2.4} />
    </button>
  );
}
