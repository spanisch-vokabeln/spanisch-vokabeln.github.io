import React from 'react';

// The pink "← Zurück" button used at the top of every page
export default function BackButton({ onClick, children = '← Zurück', compact = false }) {
  return (
    <button type="button" onClick={onClick}
      className={`${compact ? 'px-3' : 'px-4'} py-2.5 bg-rose-100 dark:bg-rose-950 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-300 font-semibold text-sm rounded-xl transition-all flex-shrink-0`}>
      {children}
    </button>
  );
}
