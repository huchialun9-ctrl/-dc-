const fs = require('fs');
const path = require('path');

const locales = {};
const localesPath = path.join(__dirname, '../../web/locales');

// Load locales on startup
const loadLocales = () => {
    try {
        const files = fs.readdirSync(localesPath);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const lang = file.replace('.json', '');
                locales[lang] = JSON.parse(fs.readFileSync(path.join(localesPath, file), 'utf-8'));
            }
        });
    } catch (error) {
        console.error('Failed to load bot locales:', error);
    }
};

loadLocales();

/**
 * Translate a key into the target language.
 * @param {string} key - Dot notation key (e.g., 'common.welcome')
 * @param {string} lang - Language code (e.g., 'zh', 'en')
 * @returns {string} - Translated text or key if not found
 */
const t = (key, lang = 'zh') => {
    try {
        const keys = key.split('.');
        let value = locales[lang] || locales['zh'];

        for (const k of keys) {
            if (value === null || typeof value !== 'object') return key;
            value = value[k];
            if (value === undefined) return key;
        }
        return value;
    } catch (e) {
        return key;
    }
};

module.exports = { t, loadLocales };
