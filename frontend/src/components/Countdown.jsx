// Time left until `target`. Calls onEnd once when it reaches zero.
//   <Countdown target={...} />               01 : 24 : 36  with Hours / Minutes / Seconds labels
//   <Countdown target={...} variant="text" /> "01 : 24 : 36" as plain text (for pills and buttons)
import { Fragment, useEffect, useRef } from 'react';
import { useNow } from '../hooks';

const pad = (n) => String(n).padStart(2, '0');

export function timeParts(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export default function Countdown({ target, onEnd, variant = 'boxes', className = '' }) {
  const now = useNow();
  const ms = Math.max(0, new Date(target) - now);

  const ended = useRef(false);
  useEffect(() => {
    if (ms === 0 && !ended.current) {
      ended.current = true;
      onEnd?.();
    }
  }, [ms, onEnd]);

  const { d, h, m, s } = timeParts(ms);

  if (variant === 'text') {
    return <span className={className}>{(d > 0 ? `${d}d ` : '') + `${pad(h)} : ${pad(m)} : ${pad(s)}`}</span>;
  }

  const parts = [[h, 'Hours'], [m, 'Minutes'], [s, 'Seconds']];
  if (d > 0) parts.unshift([d, 'Days']);
  return (
    <div className={'countdown ' + className}>
      {parts.map(([n, label], i) => (
        <Fragment key={label}>
          {i > 0 && <span className="sep">:</span>}
          <div className="unit">
            <span className="num">{pad(n)}</span>
            <span className="lbl">{label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
