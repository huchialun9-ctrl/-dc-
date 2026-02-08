import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

let notificationId = 0;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'info', duration = 5000) => {
        const id = ++notificationId;
        const notification = {
            id,
            message,
            type, // 'info' | 'success' | 'warning' | 'error'
            read: false,
            timestamp: new Date(),
        };

        setNotifications(prev => [notification, ...prev]);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, duration);
        }

        return id;
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                removeNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};
