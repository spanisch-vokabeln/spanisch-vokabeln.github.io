import { useEffect, useRef } from 'react';
import { useBackHandler } from './backStack';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
let scrollLocks = 0;
const openDialogs = []; // innermost last; only it reacts to keys

// Shared dialog behaviour: Esc and the back button close it, focus moves into the
// dialog and stays there (Tab cycles), the page behind does not scroll, and focus
// returns to the previously focused element afterwards.
// Put the returned ref on the dialog panel together with role="dialog" aria-modal="true".
export function useDialog(onClose) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useBackHandler(true, () => closeRef.current());

  useEffect(() => {
    const previous = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });

    if (scrollLocks++ === 0) document.body.style.overflow = 'hidden';
    const token = {};
    openDialogs.push(token);

    const onKey = (e) => {
      if (openDialogs[openDialogs.length - 1] !== token) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); return; }
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      openDialogs.splice(openDialogs.indexOf(token), 1);
      if (--scrollLocks === 0) document.body.style.overflow = '';
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    };
  }, []);

  return panelRef;
}
