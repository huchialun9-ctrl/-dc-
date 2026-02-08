import { useState, useEffect, useRef, useCallback } from 'react';

const useCollaboration = (guildId, userId) => {
    const [isConnected, setIsConnected] = useState(false);
    const [activeUsers, setActiveUsers] = useState([]);
    const [remoteChanges, setRemoteChanges] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (!guildId || !userId) return;

        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/collab/${guildId}`;

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);

                // Send join message
                ws.send(JSON.stringify({
                    type: 'join',
                    userId,
                    guildId,
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'user-joined':
                            setActiveUsers(data.users || []);
                            break;

                        case 'user-left':
                            setActiveUsers(data.users || []);
                            break;

                        case 'structure-update':
                            // Only apply if it's from another user
                            if (data.userId !== userId) {
                                setRemoteChanges({
                                    userId: data.userId,
                                    changes: data.changes,
                                    timestamp: data.timestamp,
                                });
                            }
                            break;

                        case 'active-users':
                            setActiveUsers(data.users || []);
                            break;

                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);

                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connect();
                }, 3000);
            };
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
        }
    }, [guildId, userId]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    }, []);

    const sendUpdate = useCallback((changes) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'structure-update',
                userId,
                guildId,
                changes,
                timestamp: Date.now(),
            }));
        }
    }, [userId, guildId]);

    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        activeUsers,
        remoteChanges,
        sendUpdate,
        reconnect: connect,
    };
};

export default useCollaboration;
