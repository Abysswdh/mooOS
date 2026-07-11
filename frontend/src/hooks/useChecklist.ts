// =============================================================================
// MooOS v2 — useChecklist Hook (Convention #5)
// =============================================================================
// Synced with Axel's ChecklistResponse, ChecklistTaskResponse
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import type { ChecklistTask, ChecklistResponse } from '@/types';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

interface UseChecklistReturn {
  tasks: ChecklistTask[];
  completedCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  completeTask: (taskId: number) => Promise<void>;
}

export function useChecklist(): UseChecklistReturn {
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  // Fetch checklist — Axel returns { tasks, total, completed_count }
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<ChecklistResponse>('/checklist')
      .then((res) => {
        if (!cancelled) {
          setTasks(res.tasks);
          setTotalCount(res.total);
          setCompletedCount(res.completed_count);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat checklist');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [trigger]);

  // Polling
  useEffect(() => {
    intervalRef.current = setInterval(refetch, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refetch]);

  // Mark task as complete — task id is number (int from DB)
  const completeTask = useCallback(async (taskId: number) => {
    await apiPost(`/checklist/${taskId}/complete`, { task_id: taskId });
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    setCompletedCount((prev) => prev + 1);
  }, []);

  return { tasks, completedCount, totalCount, isLoading, error, refetch, completeTask };
}
