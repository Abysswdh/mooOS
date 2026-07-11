// =============================================================================
// MooOS v2 — SSE (Server-Sent Events) Connection Manager
// =============================================================================
// Manages real-time connection to backend notification stream.
// Used by useNotifications hook — do not import this directly in components.
// =============================================================================

import type { Notification } from '@/types';

type SSEListener = (notification: Notification) => void;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let eventSource: EventSource | null = null;
let listeners: Set<SSEListener> = new Set();
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Connect to the SSE notification stream.
 * Auto-reconnects on disconnect with exponential backoff.
 */
export function connectSSE(): void {
  if (eventSource?.readyState === EventSource.OPEN) return;

  // Clean up existing connection
  disconnectSSE();

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      // Do not attempt to connect if there is no token (e.g. user is logged out)
      return;
    }
    const url = new URL(`${API_BASE}/notifications/stream`);
    url.searchParams.append('token', token);
    
    eventSource = new EventSource(
      url.toString(),
      { withCredentials: true }
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') {
          return;
        }
        
        // If data is wrapped like { type: "notification", data: { ... } }
        const notification: Notification = data.type === 'notification' && data.data ? data.data : data;
        listeners.forEach((listener) => listener(notification));
      } catch {
        // Ignore malformed events
      }
    };

    eventSource.onerror = (e: any) => {
      eventSource?.close();
      eventSource = null;
      
      // If unauthorized (which closes the connection) or no token, don't spam retries
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        return;
      }

      // Auto-reconnect after 5 seconds
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        if (listeners.size > 0) connectSSE();
      }, 5000);
    };
  } catch {
    // SSE not supported or network error — will retry
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      if (listeners.size > 0) connectSSE();
    }, 5000);
  }
}

/**
 * Disconnect from SSE stream and clean up.
 */
export function disconnectSSE(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

/**
 * Subscribe to real-time notifications.
 * Returns an unsubscribe function.
 */
export function onNotification(listener: SSEListener): () => void {
  listeners.add(listener);

  // Auto-connect when first listener subscribes
  if (listeners.size === 1) connectSSE();

  return () => {
    listeners.delete(listener);
    // Auto-disconnect when no listeners remain
    if (listeners.size === 0) disconnectSSE();
  };
}
