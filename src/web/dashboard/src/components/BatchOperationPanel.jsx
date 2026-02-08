import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Square, Play, Loader, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BatchOperationPanel = ({ isOpen, onClose, guilds, structure, onExecute }) => {
    const { t } = useTranslation();
    const [selectedGuilds, setSelectedGuilds] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [results, setResults] = useState(null);

    const toggleGuild = (guildId) => {
        setSelectedGuilds(prev =>
            prev.includes(guildId)
                ? prev.filter(id => id !== guildId)
                : [...prev, guildId]
        );
    };

    const toggleAll = () => {
        if (selectedGuilds.length === guilds.length) {
            setSelectedGuilds([]);
        } else {
            setSelectedGuilds(guilds.map(g => g.id));
        }
    };

    const handleExecute = async () => {
        if (selectedGuilds.length === 0) return;

        setIsExecuting(true);
        setResults(null);

        try {
            const response = await onExecute(selectedGuilds, structure);
            setResults(response);
        } catch (error) {
            console.error('Batch execution failed:', error);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleClose = () => {
        setSelectedGuilds([]);
        setResults(null);
        onClose();
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
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {t('batch.title')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {t('batch.description')}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Server Selection */}
                    {!isExecuting && !results && (
                        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('batch.selectServers')} ({selectedGuilds.length}/{guilds.length})
                                </label>
                                <button
                                    onClick={toggleAll}
                                    className="text-sm text-discord-blurple hover:underline"
                                >
                                    {selectedGuilds.length === guilds.length ? t('batch.deselectAll') : t('batch.selectAll')}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {guilds.map((guild) => (
                                    <button
                                        key={guild.id}
                                        onClick={() => toggleGuild(guild.id)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                    >
                                        {selectedGuilds.includes(guild.id) ? (
                                            <CheckSquare className="w-5 h-5 text-discord-blurple flex-shrink-0" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        )}
                                        {guild.icon && (
                                            <img
                                                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                                alt={guild.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        )}
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {guild.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Progress */}
                    {isExecuting && (
                        <div className="p-8 text-center">
                            <Loader className="w-12 h-12 text-discord-blurple animate-spin mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                {t('batch.executing')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('batch.executingDesc', { count: selectedGuilds.length })}
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {results && (
                        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
                            <div className="mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                                    {t('batch.results')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {results.filter(r => r.status === 'success').length}/{results.length} {t('batch.successful')}
                                </p>
                            </div>
                            <div className="space-y-2">
                                {results.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${result.status === 'success'
                                                ? 'bg-green-50 dark:bg-green-900/20'
                                                : 'bg-red-50 dark:bg-red-900/20'
                                            }`}
                                    >
                                        {result.status === 'success' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {guilds.find(g => g.id === result.guildId)?.name}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                {result.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                        {results ? (
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 bg-discord-blurple text-white rounded-lg hover:bg-discord-blurple/90 transition-colors font-medium"
                            >
                                {t('common.close')}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleExecute}
                                    disabled={selectedGuilds.length === 0 || isExecuting}
                                    className="px-6 py-2 bg-discord-blurple text-white rounded-lg hover:bg-discord-blurple/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    {t('batch.execute')} ({selectedGuilds.length})
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BatchOperationPanel;
