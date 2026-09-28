import { useEffect, useRef, useState } from 'react';
import formatCurrency from '../../utils/formatCurrency';

/** One short animation per actual value change. Assistive tech gets the final value. */
export default function AnimatedAmount({ value, currency }) {
  const [display, setDisplay] = useState(() =>
    matchMedia('(prefers-reduced-motion: reduce)').matches ? Number(value) : 0
  );
  const previous = useRef(display);
  useEffect(() => {
    const target = Number(value);
    if (!Number.isFinite(target)) return;
    const from = previous.current;
    previous.current = target;
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      from === target
    ) {
      setDisplay(target);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / 650, 1);
      setDisplay(from + (target - from) * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span>
      <span className="sr-only">{formatCurrency(value, currency)}</span>
      <span aria-hidden="true">{formatCurrency(display, currency)}</span>
    </span>
  );
}
