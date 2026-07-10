// =============================================================================
// MooOS v2 — useNotifications Hook (Convention #5)
// =============================================================================
// Combines SSE real-time stream + REST fetch for notification history.
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { onNotification } from '@/lib/sse';
import { toastInfo, toastWarning } from '@/lib/notify';
import type { Notification } from '@/types';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => void;
}

/**
 * Notification types that should show a warning toast instead of info.
 */
const WARNING_TYPES = new Set(['SICK_COW', 'DEAD_COW', 'OFFER_REJECTED']);

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  // Fetch notification history
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<Notification[]>('/notifications')
      .then((res) => {
        if (!cancelled) setNotifications(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat notifikasi');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [trigger]);

  // Subscribe to real-time SSE notifications
  useEffect(() => {
    const unsubscribe = onNotification((notification) => {
      // Add to front of list
      setNotifications((prev) => [notification, ...prev]);

      // Show toast
      if (WARNING_TYPES.has(notification.type)) {
        toastWarning(notification.message);
      } else {
        toastInfo(notification.message);
      }
    });

    return unsubscribe;
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: number) => {
    await apiPost(`/notifications/${id}/read`, {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    await apiPost('/notifications/read-all', {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
