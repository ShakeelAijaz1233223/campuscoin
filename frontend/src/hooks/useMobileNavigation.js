import { useEffect, useRef, useState } from 'react';

/** Off-canvas navigation is a modal on small screens, not an invisible tab stop. */
export default function useMobileNavigation(open, onClose) {
  const ref = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const [mobile, setMobile] = useState(
    () => matchMedia('(max-width: 760px)').matches
  );
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)');
    const change = () => {
      setMobile(media.matches);
      if (!media.matches) close.current();
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!mobile || !open) return;
    const prior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const background = [...document.querySelectorAll('.app-main, .mobile-nav')];
    background.forEach((node) => (node.inert = true));
    const focusable = () =>
      [
        ...ref.current.querySelectorAll(
          'a[href],button:not(:disabled),[tabindex="0"]'
        )
      ].filter((node) => node.getClientRects().length);
    focusable()[0]?.focus();
    const key = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const nodes = focusable(),
        first = nodes[0],
        last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
      background.forEach((node) => (node.inert = false));
      prior?.focus();
    };
  }, [mobile, open]);
  return { ref, mobile };
}
