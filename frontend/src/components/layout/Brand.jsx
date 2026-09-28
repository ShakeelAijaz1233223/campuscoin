import { useId } from 'react';
import { Link } from 'react-router-dom';
export function CoinMark({ size = 38 }) {
  const id = useId().replaceAll(':', '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#93e9ed" />
          <stop offset="1" stopColor="#a597e8" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="20" fill={`url(#${id})`} />
      <circle
        cx="22"
        cy="22"
        r="15.4"
        fill="none"
        stroke="#ffffff"
        strokeOpacity=".55"
        strokeWidth="1.3"
        strokeDasharray="2.2 3.1"
      />
      <path
        d="M17.6 27.4c1.2 1.5 3 2.4 5 2.4 3.1 0 5.1-1.7 5.1-4 0-2.1-1.5-3.3-4.7-4-2.9-.6-3.8-1.3-3.8-2.5 0-1.4 1.3-2.4 3.3-2.4 1.7 0 3.1.7 4.1 2l2.2-1.7c-1.2-1.7-3.2-2.8-5.5-2.9v-2h-2.3v2c-3 .4-5 2.2-5 4.8 0 2.6 1.9 3.9 5.2 4.6 2.6.5 3.3 1.1 3.3 2.3 0 1.3-1.2 2.2-3.2 2.2-2 0-3.6-.9-4.7-2.5z"
        fill="#112432"
        transform="translate(-1.2,0)"
      />
    </svg>
  );
}
export default function Brand({ tagline = true, size = 38 }) {
  return (
    <Link to="/" className="brand" aria-label="CampusCoin home">
      <CoinMark size={size} />
      <span>
        {tagline ? (
          <span>
            <span className="brand-name">
              campus<i>coin</i>
              <sup>®</sup>
            </span>
            <span className="brand-tagline">YOUR MONEY. YOUR MOMENTUM.</span>
          </span>
        ) : (
          <span className="brand-name">
            campus<i>coin</i>
            <sup>®</sup>
          </span>
        )}
      </span>
    </Link>
  );
}
