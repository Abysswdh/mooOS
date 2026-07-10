// =============================================================================
// MooOS v2 — useNotifications Hook (Convention #5)
// =============================================================================
// Synced with Axel's NotificationResponse, NotificationListResponse
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { onNotification } from '@/lib/sse';
import { toastInfo, toastWarning } from '@/lib/notify';
import type { Notification, NotificationListResponse } from '@/types';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (ids: number[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => void;
}

/**
 * Notification types that should show a warning toast instead of info.
 */
const WARNING_TYPES = new Set(['SICK_COW', 'DEAD_COW', 'OFFER_REJECTED']);

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  // Fetch notification history — Axel returns { items, total, unread_count }
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<NotificationListResponse>('/notifications')
      .then((res) => {
        if (!cancelled) {
          setNotifications(res.items);
          setUnreadCount(res.unread_count);
        }
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
      setUnreadCount((prev) => prev + 1);

      // Show toast
      const message = notification.message || notification.title;
      if (WARNING_TYPES.has(notification.type)) {
        toastWarning(message);
      } else {
        toastInfo(message);
      }
    });

    return unsubscribe;
  }, []);

  // Mark notifications as read — Axel expects { notification_ids: number[] }
  const markAsRead = useCallback(async (ids: number[]) => {
    await apiPost('/notifications/read', { notification_ids: ids });
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - ids.length));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  }, [notifications, markAsRead]);

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
