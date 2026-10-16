import { useEffect, useRef, useState } from 'react';

// Calls fn every `ms` milliseconds. Pass ms = null to pause.
export function useInterval(fn, ms) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => saved.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

// The current time, updated every second (drives countdowns)
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), 1000);
  return now;
}
