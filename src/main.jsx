import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { DarkProvider } from './utils/darkMode.jsx';

// No page zoom (like in an app): Safari on iPhone/iPad ignores user-scalable=no for
// pinch gestures, and trackpads zoom with Ctrl + wheel. Normal scrolling stays.
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, e => e.preventDefault(), { passive: false });
}
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DarkProvider>
      <App />
    </DarkProvider>
  </StrictMode>
);
