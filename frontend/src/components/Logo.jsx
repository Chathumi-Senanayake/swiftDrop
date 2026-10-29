// SwiftDrop brand mark: a gold drop with a lightning bolt, on a burgundy tile (same artwork as public/favicon.svg)
import { useId } from 'react';

export function LogoMark({ size = 32 }) {
  const id = useId();
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b3365a" />
          <stop offset="0.55" stopColor="#8c1c3a" />
          <stop offset="1" stopColor="#5a0b22" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e3a1" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="1" stopColor="#a8801c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}t)`} />
      <path className="logo-drop" d="M32 8C32 8 14 27.5 14 39.5a18 18 0 0 0 36 0C50 27.5 32 8 32 8Z" fill={`url(#${id}g)`} />
      <path className="logo-bolt" d="M35.5 21 23.5 40h8.5l-3 13 13-19.5H33.5l2-12.5Z" fill="#6b1029" />
    </svg>
  );
}

// Mark + "SwiftDrop" wordmark
export default function Logo({ size = 32 }) {
  return (
    <>
      <LogoMark size={size} />
      <span className="logo-word">Swift<span>Drop</span></span>
    </>
  );
}
