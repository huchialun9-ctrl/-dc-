const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '../locales');
const locales = {
    zh: JSON.parse(fs.readFileSync(path.join(localesPath, 'zh.json'), 'utf8')),
    en: JSON.parse(fs.readFileSync(path.join(localesPath, 'en.json'), 'utf8'))
};

module.exports = (req, res, next) => {
    // Get lang from cookie or default to 'zh'
    const lang = req.cookies?.lang || 'zh';

    // Attach translation helper
    res.locals.t = (key) => {
        try {
            const keys = key.split('.');
            let value = locales[lang] || locales['zh'];

            for (const k of keys) {
                if (value === null || typeof value !== 'object') return key;
                value = value[k];
                if (value === undefined) return key; // Fallback to key if not found
            }
            return value;
        } catch (e) {
            console.error(`i18n Error for key "${key}":`, e.message);
            return key;
        }
    };

    // Attach current language for UI toggles
    res.locals.currentLang = lang;

    next();
};
