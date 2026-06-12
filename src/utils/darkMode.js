import { createContext, useContext, useState, useEffect } from 'react';

const DarkCtx = createContext({ dark: false, setDark: () => {} });

export function DarkProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return <DarkCtx.Provider value={{ dark, setDark }}>{children}</DarkCtx.Provider>;
}

export const useDark = () => useContext(DarkCtx);
