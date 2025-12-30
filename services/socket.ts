
import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger.ts';
import { API_BASE_URL, ENABLE_MOCK_FALLBACK } from '../constants.ts';

type EventCallback = (data: any) => void;

/**
 * Low-level Socket Transport Manager
 * Responsible for connection lifecycle and raw packet distribution
 */
class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private eventHandlers = new Map<string, Set<EventCallback>>();
  private connectionAttempts = 0;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) SocketManager.instance = new SocketManager();
    return SocketManager.instance;
  }

  public connect(token: string) {
    if (this.socket?.connected) return;

    // Remove version path for socket connection to base server
    const socketUrl = API_BASE_URL.replace('/api/v1', '');

    this.socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000, // Increased delay to reduce spam
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      transports: ['polling', 'websocket'], 
    });

    this.socket.on('connect', () => {
      this.connectionAttempts = 0;
      logger.info('[Socket] Link Established');
    });
    
    this.socket.on('connect_error', (err) => {
      this.connectionAttempts++;
      
      // Only log as error on the first failure. Subsequent failures are logged as warnings
      // to reduce console noise if the server is expected to be down (Demo Mode).
      const logMethod = (this.connectionAttempts === 1 && !ENABLE_MOCK_FALLBACK) ? 'error' : 'warn';
      
      logger[logMethod](`[Socket] Link Failure (Attempt ${this.connectionAttempts}/5)`, { 
        message: err.message,
        context: 'Transport link to nexus could not be established.'
      });

      if (this.connectionAttempts >= 5) {
        logger.warn('[Socket] Max reconnection attempts reached. Operational telemetry suspended.');
        this.disconnect();
      }
    });
    
    this.socket.onAny((event, data) => {
      const handlers = this.eventHandlers.get(event);
      handlers?.forEach(cb => cb(data));
    });
  }

  public subscribe(event: string, callback: EventCallback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback);
    return () => this.eventHandlers.get(event)?.delete(callback);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionAttempts = 0;
    this.eventHandlers.clear();
  }
}

export const socketManager = SocketManager.getInstance();
