import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
];

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode);
        localStorage.setItem('language', langCode);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Select language"
            >
                <Globe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${currentLang.code === lang.code ? 'bg-discord-blurple/10 dark:bg-discord-blurple/20' : ''
                                    }`}
                            >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {lang.name}
                                </span>
                                {currentLang.code === lang.code && (
                                    <Check className="w-4 h-4 text-discord-blurple" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LanguageSelector;
