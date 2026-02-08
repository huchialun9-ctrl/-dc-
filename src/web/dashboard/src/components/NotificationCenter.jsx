import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const NotificationCenter = () => {
    const { t } = useTranslation();
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotificationIcon = (type) => {
        const iconClass = "w-4 h-4";
        switch (type) {
            case 'success': return <Check className={`${iconClass} text-discord-green`} />;
            case 'error': return <X className={`${iconClass} text-discord-red`} />;
            case 'warning': return <span className={`${iconClass} text-discord-yellow`}>⚠</span>;
            default: return <span className={`${iconClass} text-discord-blurple`}>ℹ</span>;
        }
    };

    const formatTime = (timestamp) => {
        const now = new Date();
        const diff = Math.floor((now - new Date(timestamp)) / 1000); // seconds

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-discord-red text-white text-xs font-bold rounded-full flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('notifications.title')}</h3>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <>
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-discord-blurple hover:underline"
                                        >
                                            {t('notifications.markAllRead')}
                                        </button>
                                        <span className="text-gray-400">|</span>
                                        <button
                                            onClick={clearAll}
                                            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            {t('notifications.clearAll')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">{t('notifications.noNotifications')}</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-discord-blurple/5 dark:bg-discord-blurple/10' : ''
                                            }`}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {formatTime(notification.timestamp)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNotification(notification.id);
                                                }}
                                                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
