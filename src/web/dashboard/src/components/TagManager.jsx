import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PRESET_COLORS = [
    '#5865F2', // Discord blue
    '#57F287', // Green
    '#FEE75C', // Yellow
    '#ED4245', // Red
    '#EB459E', // Pink
    '#9B59B6', // Purple
    '#3498DB', // Light blue
    '#E67E22', // Orange
    '#95A5A6', // Gray
    '#1ABC9C', // Teal
];

const TagManager = ({ isOpen, onClose, tags, onCreateTag, onDeleteTag }) => {
    const { t } = useTranslation();
    const [newTagName, setNewTagName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

    const handleCreate = () => {
        if (newTagName.trim()) {
            onCreateTag({
                id: Date.now().toString(),
                name: newTagName.trim(),
                color: selectedColor,
            });
            setNewTagName('');
            setSelectedColor(PRESET_COLORS[0]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCreate();
        }
    };

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
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-discord-blurple/10 dark:bg-discord-blurple/20 flex items-center justify-center">
                                <TagIcon className="w-5 h-5 text-discord-blurple" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {t('tags.title')}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Create New Tag */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tags.createNew')}
                        </label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={t('tags.namePlaceholder')}
                                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-discord-blurple text-gray-900 dark:text-gray-100"
                            />
                            <button
                                onClick={handleCreate}
                                disabled={!newTagName.trim()}
                                className="px-4 py-2 bg-discord-blurple text-white rounded-lg hover:bg-discord-blurple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {t('tags.create')}
                            </button>
                        </div>

                        {/* Color Picker */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                {t('tags.selectColor')}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-8 h-8 rounded-full transition-all ${selectedColor === color
                                                ? 'ring-2 ring-offset-2 ring-discord-blurple dark:ring-offset-gray-800 scale-110'
                                                : 'hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Existing Tags */}
                    <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {t('tags.existingTags')} ({tags.length})
                        </label>
                        {tags.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <TagIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">{t('tags.noTags')}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tags.map((tag) => (
                                    <div
                                        key={tag.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {tag.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onDeleteTag(tag.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TagManager;
