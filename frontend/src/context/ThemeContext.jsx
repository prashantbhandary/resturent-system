import { createContext, useContext, useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'dineqr_theme';
const ThemeContext = createContext(null);

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(theme) {
  if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return theme;
}

function apply(resolved) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

/**
 * Theme provider with three modes: 'light' | 'dark' | 'system'.
 * The initial class is set by the inline script in index.html (zero flash);
 * this provider keeps React state in sync and reacts to system changes.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'system'
  );
  const [resolved, setResolved] = useState(() => resolve(theme));

  useEffect(() => {
    const r = resolve(theme);
    setResolved(r);
    apply(r);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Follow OS changes while in 'system' mode.
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const r = systemPrefersDark() ? 'dark' : 'light';
      setResolved(r);
      apply(r);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((t) => setThemeState(t), []);
  const toggle = useCallback(
    () => setThemeState(resolve(theme) === 'dark' ? 'light' : 'dark'),
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
