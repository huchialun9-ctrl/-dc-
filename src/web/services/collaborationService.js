const WebSocket = require('ws');
const EventEmitter = require('events');

class CollaborationService extends EventEmitter {
    constructor() {
        super();
        // Store rooms: guildId -> Set of client objects
        this.rooms = new Map();
        // Store user info: clientId -> { userId, guildId, ws }
        this.clients = new Map();
    }

    /**
     * Initialize WebSocket server
     * @param {Object} server - HTTP server instance
     */
    initialize(server) {
        this.wss = new WebSocket.Server({
            noServer: true,
            path: '/collab'
        });

        // Handle upgrade requests
        server.on('upgrade', (request, socket, head) => {
            const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

            if (pathname.startsWith('/collab/')) {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    const guildId = pathname.split('/collab/')[1];
                    this.wss.emit('connection', ws, request, guildId);
                });
            } else {
                socket.destroy();
            }
        });

        this.wss.on('connection', (ws, request, guildId) => {
            this.handleConnection(ws, guildId);
        });

        console.log('✅ Collaboration service initialized');
    }

    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, guildId) {
        const clientId = this.generateClientId();

        console.log(`New client connecting to guild: ${guildId}`);

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(clientId, ws, guildId, message);
            } catch (error) {
                console.error('Error parsing message:', error);
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            this.handleDisconnect(clientId, guildId);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for client ${clientId}:`, error);
        });
    }

    /**
     * Handle incoming messages
     */
    handleMessage(clientId, ws, guildId, message) {
        switch (message.type) {
            case 'join':
                this.handleJoin(clientId, ws, guildId, message.userId);
                break;

            case 'structure-update':
                this.broadcastUpdate(guildId, clientId, message);
                break;

            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    }

    /**
     * Handle user joining a room
     */
    handleJoin(clientId, ws, guildId, userId) {
        // Store client info
        this.clients.set(clientId, { userId, guildId, ws });

        // Add to room
        if (!this.rooms.has(guildId)) {
            this.rooms.set(guildId, new Set());
        }
        this.rooms.get(guildId).add(clientId);

        console.log(`✅ Client ${userId} joined guild ${guildId}`);

        // Get active users in this room
        const activeUsers = this.getActiveUsers(guildId);

        // Notify all users in the room
        this.broadcast(guildId, {
            type: 'user-joined',
            userId,
            users: activeUsers,
        });

        // Send active users list to the new client
        ws.send(JSON.stringify({
            type: 'active-users',
            users: activeUsers,
        }));
    }

    /**
     * Handle user disconnection
     */
    handleDisconnect(clientId, guildId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const { userId } = client;

        // Remove from room
        const room = this.rooms.get(guildId);
        if (room) {
            room.delete(clientId);
            if (room.size === 0) {
                this.rooms.delete(guildId);
            }
        }

        // Remove client
        this.clients.delete(clientId);

        console.log(`❌ Client ${userId} left guild ${guildId}`);

        // Notify remaining users
        const activeUsers = this.getActiveUsers(guildId);
        this.broadcast(guildId, {
            type: 'user-left',
            userId,
            users: activeUsers,
        });
    }

    /**
     * Broadcast structure update to all clients in a room
     */
    broadcastUpdate(guildId, senderClientId, message) {
        this.broadcast(guildId, message, senderClientId);
    }

    /**
     * Broadcast message to all clients in a room
     * @param {string} guildId - Guild ID
     * @param {Object} message - Message to broadcast
     * @param {string} excludeClientId - Optional client ID to exclude
     */
    broadcast(guildId, message, excludeClientId = null) {
        const room = this.rooms.get(guildId);
        if (!room) return;

        const messageStr = JSON.stringify(message);

        room.forEach(clientId => {
            if (clientId === excludeClientId) return;

            const client = this.clients.get(clientId);
            if (client && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(messageStr);
            }
        });
    }

    /**
     * Get list of active users in a room
     */
    getActiveUsers(guildId) {
        const room = this.rooms.get(guildId);
        if (!room) return [];

        return Array.from(room)
            .map(clientId => {
                const client = this.clients.get(clientId);
                return client ? { userId: client.userId, clientId } : null;
            })
            .filter(Boolean);
    }

    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            totalClients: this.clients.size,
            totalRooms: this.rooms.size,
            rooms: Array.from(this.rooms.entries()).map(([guildId, clients]) => ({
                guildId,
                userCount: clients.size,
            })),
        };
    }
}

// Singleton instance
const collaborationService = new CollaborationService();

module.exports = collaborationService;
