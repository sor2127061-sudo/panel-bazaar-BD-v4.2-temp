import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeCtx { theme: Theme; toggleTheme: () => void; }
const ThemeContext = createContext<ThemeCtx>({ theme: 'dark', toggleTheme: () => {} });

/** Apply theme attribute instantly with no-transition guard to prevent flicker */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Block all transitions for one frame to prevent flicker
  root.classList.add('no-transition');
  root.setAttribute('data-theme', theme);
  // Force reflow so the class takes effect before removal
  void root.offsetHeight;
  // Re-enable transitions after the browser paints the new theme
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('no-transition');
    });
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('pb_theme') as Theme) || 'dark'; } catch { return 'dark'; }
  });

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem('pb_theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }
