import { useState, useEffect, useCallback, useMemo, useReducer } from 'react'
import ThemeContext from './themeContext.js'

const STORAGE_KEY = 'theme';
const THEMES = ['light', 'dark', 'system'];

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(theme) {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [, forceSystemThemeRecheck] = useReducer((c) => c + 1, 0);
  const resolvedTheme = resolveTheme(theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', forceSystemThemeRecheck);
    return () => mql.removeEventListener('change', forceSystemThemeRecheck);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — storage unavailable (private browsing, etc.); theme still applies for this session
    }
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
