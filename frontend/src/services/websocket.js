import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to specific event
  subscribe(event, callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on(event, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Unsubscribe from event
  unsubscribe(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) callbacks.splice(index, 1);
      }
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  // Emit event to server
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  // ============================================================================
  // SPECIFIC EVENT HANDLERS
  // ============================================================================

  // Fix application progress
  onFixProgress(callback) {
    this.subscribe('fix:progress', callback);
  }

  offFixProgress(callback) {
    this.unsubscribe('fix:progress', callback);
  }

  // Audit completion
  onAuditComplete(callback) {
    this.subscribe('audit:complete', callback);
  }

  offAuditComplete(callback) {
    this.unsubscribe('audit:complete', callback);
  }

  // A/B test updates
  onABTestUpdate(callback) {
    this.subscribe('abtest:update', callback);
  }

  offABTestUpdate(callback) {
    this.unsubscribe('abtest:update', callback);
  }

  // Real-time metrics
  onMetricsUpdate(callback) {
    this.subscribe('metrics:update', callback);
  }

  offMetricsUpdate(callback) {
    this.unsubscribe('metrics:update', callback);
  }

  // Store connection status
  onStoreStatus(callback) {
    this.subscribe('store:status', callback);
  }

  offStoreStatus(callback) {
    this.unsubscribe('store:status', callback);
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;