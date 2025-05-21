import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import frTranslations from './locales/fr.json';
import esTranslations from './locales/es.json';

// Debug logging
console.log('Loading translations:', { en: enTranslations, hi: hiTranslations, fr: frTranslations, es: esTranslations });

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      hi: {
        translation: hiTranslations
      },
      fr: {
        translation: frTranslations
      },
      es: {
        translation: esTranslations
      }
    },
    lng: localStorage.getItem('language') || 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false, // This is important for immediate updates
      bindI18n: 'languageChanged loaded', // Bind to languageChanged and loaded events
      bindI18nStore: 'added removed', // Bind to added and removed events
      transEmptyNodeValue: '', // Return empty string for empty nodes
      transSupportBasicHtmlNodes: true, // Support basic HTML nodes
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'] // Keep these HTML nodes
    }
  });

// Add language change listener
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  localStorage.setItem('language', lng);
  document.documentElement.lang = lng;
  // Force a re-render of the app
  window.dispatchEvent(new Event('languageChanged'));
});

export default i18n; 