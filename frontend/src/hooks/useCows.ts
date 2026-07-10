// =============================================================================
// MooOS v2 — useCows Hook (Convention #5)
// =============================================================================
// Synced with Axel's CowResponse, CowListResponse, CowCreate, CowUpdate
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api';
import type { Cow, CowCreateInput, CowUpdateInput, ListResponse } from '@/types';

interface UseCowsReturn {
  cows: Cow[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseCowReturn {
  cow: Cow | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseCowMutationsReturn {
  createCow: (data: CowCreateInput) => Promise<Cow>;
  updateCow: (id: number, data: CowUpdateInput) => Promise<Cow>;
  deleteCow: (id: number) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Fetch all cows.
 * Backend returns: { items: CowResponse[], total: int }
 */
export function useCows(): UseCowsReturn {
  const [cows, setCows] = useState<Cow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<ListResponse<Cow>>('/cows')
      .then((res) => {
        if (!cancelled) {
          setCows(res.items);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat data sapi');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [trigger]);

  return { cows, total, isLoading, error, refetch };
}

/**
 * Fetch a single cow by ID.
 */
export function useCow(id: number | null): UseCowReturn {
  const [cow, setCow] = useState<Cow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    if (id === null) {
      setCow(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<Cow>(`/cows/${id}`)
      .then((res) => {
        if (!cancelled) setCow(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gagal memuat data sapi');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, trigger]);

  return { cow, isLoading, error, refetch };
}

/**
 * Cow CRUD mutations (create, update, delete).
 */
export function useCowMutations(): UseCowMutationsReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCow = useCallback(async (data: CowCreateInput): Promise<Cow> => {
    setIsSubmitting(true);
    try {
      return await apiPost<Cow>('/cows', data);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateCow = useCallback(async (id: number, data: CowUpdateInput): Promise<Cow> => {
    setIsSubmitting(true);
    try {
      return await apiPut<Cow>(`/cows/${id}`, data);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const deleteCow = useCallback(async (id: number): Promise<void> => {
    setIsSubmitting(true);
    try {
      await apiDelete(`/cows/${id}`);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { createCow, updateCow, deleteCow, isSubmitting };
}
