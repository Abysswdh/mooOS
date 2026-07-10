// =============================================================================
// MooOS v2 — useDashboard Hook (Convention #5)
// =============================================================================
// Single entry point for all dashboard data. Composes multiple API calls.
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import type { DashboardSummary, AttendanceLog } from '@/types';

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
        // If no attendance today, that's fine
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
      const res = await apiPost<AttendanceLog>('/attendance/clock-in', {});
      setAttendance(res);
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
