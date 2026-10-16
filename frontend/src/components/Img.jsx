import { PLACEHOLDER } from '../utils';

// <img> that falls back to the placeholder when the picture fails to load
export default function Img({ src, alt = '', className }) {
  return (
    <img
      src={src || PLACEHOLDER}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = PLACEHOLDER;
      }}
    />
  );
}
