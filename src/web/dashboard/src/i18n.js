import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import zhTWTranslation from './locales/zh-TW.json';
import jaTranslation from './locales/ja.json';
import koTranslation from './locales/ko.json';

// Initialize i18next
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslation },
            'zh-TW': { translation: zhTWTranslation },
            ja: { translation: jaTranslation },
            ko: { translation: koTranslation },
        },
        lng: localStorage.getItem('language') || 'zh-TW', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
    });

export default i18n;
