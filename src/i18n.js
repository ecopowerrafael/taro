import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptCommon from './locales/pt/common.json';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';

const resources = {
  pt: { common: ptCommon },
  en: { common: enCommon },
  es: { common: esCommon },
};

// Configuração do detector customizado para IP, se necessário (simplificado aqui para usar localStorage e navigator)
const languageDetector = new LanguageDetector();

languageDetector.addDetector({
  name: 'ipDetector',
  lookup(options) {
    // Aqui seria a chamada para a API do backend ou OpenStreetMap, 
    // Mas chamadas assíncronas no init do i18n requerem setup extra. 
    // Vamos confiar primariamente no localStorage e no navigator.
    // Opcionalmente podemos setar a linguagem depois de pegar do IP.
    return undefined;
  },
  cacheUserLanguage(lng, options) {
    // Nada aqui, o detector principal cuida de salvar no localStorage
  }
});

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: 'pt',
    supportedLngs: ['pt', 'en', 'es'],
    detection: {
      order: ['localStorage', 'navigator', 'ipDetector'],
      caches: ['localStorage'],
      lookupLocalStorage: 'astria_i18nextLng',
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;
