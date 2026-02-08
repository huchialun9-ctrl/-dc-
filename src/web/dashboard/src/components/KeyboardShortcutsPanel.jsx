import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const KeyboardShortcutsPanel = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    const shortcuts = [
        {
            category: t('shortcuts.navigation'),
            items: [
                { keys: ['Ctrl', 'K'], description: t('shortcuts.openSearch') },
                { keys: ['Ctrl', 'B'], description: t('shortcuts.toggleSidebar') },
                { keys: ['Ctrl', '/'], description: t('shortcuts.showShortcuts') },
            ],
        },
        {
            category: t('shortcuts.general'),
            items: [
                { keys: ['Esc'], description: t('shortcuts.closeDialog') },
                { keys: ['Tab'], description: t('shortcuts.focusNext') },
                { keys: ['Shift', 'Tab'], description: t('shortcuts.focusPrevious') },
                { keys: ['Enter'], description: t('shortcuts.confirmSelect') },
            ],
        },
        {
            category: t('shortcuts.editing'),
            items: [
                { keys: ['Ctrl', 'S'], description: t('shortcuts.saveChanges') },
            ],
        },
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-discord-blurple/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-discord-blurple/10 dark:bg-discord-blurple/20 flex items-center justify-center">
                                <Keyboard className="w-5 h-5 text-discord-blurple" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {t('shortcuts.title')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('shortcuts.description')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Shortcuts List */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            {shortcuts.map((category, idx) => (
                                <div key={idx}>
                                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                        {category.category}
                                    </h3>
                                    <div className="space-y-2">
                                        {category.items.map((shortcut, itemIdx) => (
                                            <div
                                                key={itemIdx}
                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                <span className="text-sm text-gray-700 dark:text-gray-200">
                                                    {shortcut.description}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, keyIdx) => (
                                                        <React.Fragment key={keyIdx}>
                                                            <kbd className="px-3 py-1.5 text-xs font-mono font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
                                                                {key}
                                                            </kbd>
                                                            {keyIdx < shortcut.keys.length - 1 && (
                                                                <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">
                                                                    +
                                                                </span>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            {t('shortcuts.footer')} <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Ctrl+/</kbd>
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default KeyboardShortcutsPanel;
