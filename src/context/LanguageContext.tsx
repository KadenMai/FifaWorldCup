import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  translations,
  type Language,
  type TranslationDict,
} from '../i18n/translations';

const STORAGE_KEY = 'fifa2026-lang';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(obj: TranslationDict, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

function detectInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'vi') return stored;
  const browser = navigator.language.toLowerCase();
  return browser.startsWith('vi') ? 'vi' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectInitialLanguage);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = translations[lang];
      const value = getNestedValue(dict, key) ?? getNestedValue(translations.en, key);
      if (!value) return key;

      if (params?.count !== undefined) {
        const pluralKey = Number(params.count) === 1 ? key : `${key}_plural`;
        const pluralVal = getNestedValue(dict, pluralKey);
        if (pluralVal) return interpolate(pluralVal, params);
      }

      return interpolate(value, params);
    },
    [lang]
  );

  const locale = lang === 'vi' ? 'vi-VN' : 'en-US';

  const value = useMemo(
    () => ({ lang, setLang, t, locale }),
    [lang, setLang, t, locale]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

/** Shorthand for translations */
export function useT() {
  return useLanguage().t;
}
