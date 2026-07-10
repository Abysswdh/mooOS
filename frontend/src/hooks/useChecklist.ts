// =============================================================================
// MooOS v2 — useChecklist Hook (Convention #5)
// =============================================================================
// Fetches MRP-generated checklist tasks. Polls every 30s for updates.
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import type { ChecklistTask } from '@/types';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

interface UseChecklistReturn {
  tasks: ChecklistTask[];
  completedCount: number;
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  completeTask: (taskId: string) => Promise<void>;
}

export function useChecklist(): UseChecklistReturn {
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  // Fetch checklist
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<{ tasks: ChecklistTask[] }>('/checklist')
      .then((res) => {
        if (!cancelled) setTasks(res.tasks);
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

  // Mark task as complete
  const completeTask = useCallback(async (taskId: string) => {
    await apiPost(`/checklist/${taskId}/complete`, {});
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
  }, []);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return { tasks, completedCount, totalCount, isLoading, error, refetch, completeTask };
}
