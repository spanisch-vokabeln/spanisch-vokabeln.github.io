import { useEffect, useRef } from 'react';

// Browser/phone "back" support without a router.
//
// Every open view level (sub-page, running game, dialog …) registers a handler with
// useBackHandler. Each handler owns one history entry. Pressing back pops that entry
// and calls the topmost handler:
//   - return nothing/true → the handler closes its level (the component unmounts)
//   - return false        → stay (e.g. a cancel dialog was shown); the entry is re-added
// When a level is closed from the UI instead, its entry is removed via history.go().

const MARKER = 'vocabApp';
const stack = [];          // registered handlers, innermost last
let pendingTraversals = 0; // our own history.go() calls whose popstate is still due
let popsToFlush = 0;
let queuedPushes = 0;
let listening = false;

function pushEntry() {
  // A level closed in the same render: reuse its entry instead of popping and pushing
  if (popsToFlush > 0) { popsToFlush--; return; }
  if (pendingTraversals > 0) { queuedPushes++; return; }
  history.pushState({ [MARKER]: true }, '');
}

function flushPops() {
  if (popsToFlush <= 0) return;
  const n = popsToFlush;
  popsToFlush = 0;
  pendingTraversals++;
  history.go(-n);
}

function onPopState(e) {
  if (pendingTraversals > 0) {
    pendingTraversals--;
    if (pendingTraversals === 0) {
      while (queuedPushes > 0) { queuedPushes--; history.pushState({ [MARKER]: true }, ''); }
    }
    return;
  }
  const top = stack[stack.length - 1];
  if (!top) {
    // Leftover entries from before a reload: skip them so "back" leaves the app
    if (e.state?.[MARKER]) history.back();
    return;
  }
  top.inHistory = false;
  const result = top.onBack();
  if (result === false && stack.includes(top)) {
    top.inHistory = true;
    pushEntry();
  }
}

function ensureListener() {
  if (listening) return;
  listening = true;
  window.addEventListener('popstate', onPopState);
}

export function useBackHandler(active, onBack) {
  const ref = useRef(onBack);
  ref.current = onBack;

  useEffect(() => {
    if (!active) return;
    ensureListener();
    const entry = { onBack: () => ref.current(), inHistory: true };
    stack.push(entry);
    pushEntry();
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      if (entry.inHistory) {
        // Closed from the UI: drop our history entry (batched for several levels)
        popsToFlush++;
        queueMicrotask(flushPops);
      }
    };
  }, [active]);
}
