import React, { useState, useEffect, useRef } from 'react';
import { Search, Server, Hash, User, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const CommandPalette = ({ isOpen, onClose, guilds, selectedGuild, onSelectGuild, onNavigate }) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Build searchable items
    const items = [
        // Servers
        ...guilds.map(guild => ({
            type: 'server',
            id: guild.id,
            name: guild.name,
            icon: <Server className="w-4 h-4" />,
            action: () => {
                onSelectGuild(guild);
                onClose();
            },
        })),
        // Quick actions
        {
            type: 'action',
            id: 'settings',
            name: t('common.settings'),
            icon: <Settings className="w-4 h-4" />,
            action: () => {
                onNavigate('settings');
                onClose();
            },
        },
    ];

    // Filter items based on query
    const filteredItems = query
        ? items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        )
        : items;

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % filteredItems.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredItems[selectedIndex]) {
                        filteredItems[selectedIndex].action();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Command Palette */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            placeholder={t('common.search') + '...'}
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
                        />
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {filteredItems.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <p>{t('common.search')} no results</p>
                            </div>
                        ) : (
                            <div className="py-2">
                                {filteredItems.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => item.action()}
                                        className={`w-full flex items-center gap-3 px-5 py-3 transition-colors ${index === selectedIndex
                                                ? 'bg-discord-blurple/10 dark:bg-discord-blurple/20'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 ${index === selectedIndex ? 'text-discord-blurple' : 'text-gray-400'}`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {item.type}
                                            </p>
                                        </div>
                                        {index === selectedIndex && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">↵</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↵</kbd>
                            Select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Esc</kbd>
                            Close
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CommandPalette;
