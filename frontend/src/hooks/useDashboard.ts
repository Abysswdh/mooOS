// =============================================================================
// MooOS v2 — useDashboard Hook (Convention #5)
// =============================================================================
// Synced with Axel's DashboardSummary, AttendanceLogResponse
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import type { DashboardSummary, AttendanceLog, AttendanceClockIn } from '@/types';

interface UseDashboardReturn {
  summary: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseAttendanceReturn {
  attendance: AttendanceLog | null;
  isClockedIn: boolean;
  isLoading: boolean;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Fetch dashboard summary KPIs.
 * Axel's fields: total_cows, active_cows, sick_cows, total_members,
 *   today_milk_liters, feed_stock_kg, feed_days_remaining, feed_is_critical,
 *   fertilizer_ready_kg, today_revenue, month_revenue
 */
export function useDashboard(): UseDashboardReturn {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<DashboardSummary>('/dashboard/summary')
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat dashboard');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [trigger]);

  return { summary, isLoading, error, refetch };
}

/**
 * Manage attendance (absen masuk/pulang).
 * Clock-in returns: { id, user_id, clock_in }
 * Clock-out returns: { id, user_id, clock_in, clock_out, daily_summary }
 */
export function useAttendance(): UseAttendanceReturn {
  const [attendance, setAttendance] = useState<AttendanceLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch today's attendance on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    apiGet<AttendanceLog | null>('/attendance/today')
      .then((res) => {
        if (!cancelled) setAttendance(res);
      })
      .catch(() => {
        // No attendance today — that's fine
        if (!cancelled) setAttendance(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const isClockedIn = attendance !== null && attendance.clock_out === null;

  const clockIn = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await apiPost<AttendanceClockIn>('/attendance/clock-in', {});
      // Promote to full AttendanceLog shape
      setAttendance({
        id: res.id,
        user_id: res.user_id,
        clock_in: res.clock_in,
        clock_out: null,
        daily_summary: null,
        created_at: res.clock_in,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clockOut = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await apiPost<AttendanceLog>('/attendance/clock-out', {});
      setAttendance(res);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { attendance, isClockedIn, isLoading, clockIn, clockOut, isSubmitting };
}
