import { createContext, useContext, useState, useEffect } from 'react';
import { storageGet, storageSet } from './storage';

const DarkCtx = createContext({ dark: false, setDark: () => {} });

export function DarkProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = storageGet('theme');
    return saved ? saved === 'dark' : !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    // Phone status bar colour follows the app theme
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = dark ? '#0d0d1a' : '#4f46e5';
    storageSet('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return <DarkCtx.Provider value={{ dark, setDark }}>{children}</DarkCtx.Provider>;
}

export const useDark = () => useContext(DarkCtx);
