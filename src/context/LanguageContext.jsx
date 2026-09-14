import { useState, useEffect, useCallback, useMemo } from 'react'
import LanguageContext from './languageContext.js'
import i18n from '../i18n/i18n.js'

const STORAGE_KEY = 'language';
const LANGUAGES = ['en', 'so', 'ar'];
const RTL_LANGUAGES = ['ar'];

function getStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

function applyDocumentAttrs(lang) {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr');
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);

  useEffect(() => {
    applyDocumentAttrs(language);
    i18n.changeLanguage(language);
  }, [language]);

  const setLanguage = useCallback((next) => {
    if (!LANGUAGES.includes(next)) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — storage unavailable (private browsing, etc.); language still applies for this session
    }
    setLanguageState(next);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, isRTL: RTL_LANGUAGES.includes(language) }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
