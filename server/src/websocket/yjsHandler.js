/**
 * Yjs WebSocket Handler
 * Handles Yjs document synchronization with persistence
 */

const WebSocket = require('ws');
const { setupWSConnection } = require('@y/websocket-server/utils');
const yjsService = require('../services/yjs.service');
const { authService } = require('../services/auth.service');
const config = require('../config/env');

/**
 * Setup Yjs WebSocket server
 */
function setupYjsWebSocket(server) {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', async (ws, req, { roomSlug, user }) => {
    try {
      console.log(`🔌 Yjs connection: ${user?.username || 'anonymous'} -> ${roomSlug}`);

      // Get persisted document
      const doc = await yjsService.getDocument(roomSlug);

      // Setup Yjs connection with persistence binding
      setupWSConnection(ws, req, {
        gc: true,
        docName: roomSlug,
        // Custom persistence callback
        persistence: {
          bindState: async (docName, ydoc) => {
            // State is already bound via yjsService.getDocument()
          },
          writeState: async (docName, ydoc) => {
            // Updates are automatically persisted via yjsService
          },
        },
      });

      ws.on('close', () => {
        if (config.isDevelopment) {
          console.log(`🔌 Yjs closed: ${user?.username || 'anonymous'} -> ${roomSlug}`);
        }
      });

      ws.on('error', (err) => {
        console.error(`❌ Yjs WebSocket error (${roomSlug}):`, err.message);
      });
    } catch (error) {
      console.error('Yjs connection error:', error);
      ws.close();
    }
  });

  // Handle upgrade requests
  server.on('upgrade', async (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    // Only handle /yjs path
    if (pathname !== '/yjs') {
      socket.destroy();
      return;
    }

    try {
      // Extract room and token from query params
      const roomSlug = url.searchParams.get('room');
      const token = url.searchParams.get('token');

      if (!roomSlug) {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
        return;
      }

      // Verify authentication
      let user = null;
      if (token) {
        try {
          user = authService.verifyAccessToken(token);
        } catch (error) {
          // Token invalid - continue without auth for public rooms
          if (config.isDevelopment) {
            console.warn('Yjs auth failed:', error.message);
          }
        }
      }

      // TODO: Verify room access here
      // For now, allow all connections (will be enforced at Socket.IO level)

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, { roomSlug, user });
      });
    } catch (error) {
      console.error('Yjs upgrade error:', error);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });

  return wss;
}

module.exports = {
  setupYjsWebSocket,
};

