import { useState, useEffect } from 'react';

function useScrolled(threshold = 100) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);
  return scrolled;
}

export default function FloatingBack({ onClick }) {
  const scrolled = useScrolled();
  if (!scrolled) return null;
  return (
    <button
      onClick={onClick}
      className="fixed top-3 left-3 z-50 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-rose-600 dark:text-rose-400 font-semibold text-sm rounded-xl shadow-lg active:scale-95 transition-all"
    >
      ← Zurück
    </button>
  );
}
