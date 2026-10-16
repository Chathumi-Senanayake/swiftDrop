// Days / Hrs / Mins / Secs until `target`. Calls onEnd once when it reaches zero.
import { Fragment, useEffect, useRef } from 'react';
import { useNow } from '../hooks';

export default function Countdown({ target, red = false, onEnd }) {
  const now = useNow();
  const ms = Math.max(0, new Date(target) - now);

  const ended = useRef(false);
  useEffect(() => {
    if (ms === 0 && !ended.current) {
      ended.current = true;
      onEnd?.();
    }
  }, [ms, onEnd]);

  const s = Math.floor(ms / 1000);
  const parts = [
    [Math.floor(s / 86400), 'Days'],
    [Math.floor((s % 86400) / 3600), 'Hrs'],
    [Math.floor((s % 3600) / 60), 'Mins'],
    [s % 60, 'Secs'],
  ];
  if (parts[0][0] === 0) parts.shift(); // hide "Days" when 0

  return (
    <div className={'countdown' + (red ? ' red' : '')}>
      {parts.map(([n, label], i) => (
        <Fragment key={label}>
          {i > 0 && <span className="sep">:</span>}
          <div className="unit">
            <span className="num">{String(n).padStart(2, '0')}</span>
            <span className="lbl">{label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
