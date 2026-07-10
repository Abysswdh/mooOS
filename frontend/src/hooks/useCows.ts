// =============================================================================
// MooOS v2 — useCows Hook (Convention #5)
// =============================================================================
// Every page that needs cow data imports from here. Never standalone fetch().
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api';
import type { Cow, CreateCowInput, PaginatedResponse } from '@/types';

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
  createCow: (data: CreateCowInput) => Promise<Cow>;
  updateCow: (id: number, data: Partial<CreateCowInput>) => Promise<Cow>;
  deleteCow: (id: number) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Fetch all cows (or paginated).
 */
export function useCows(page = 1, perPage = 50): UseCowsReturn {
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

    apiGet<PaginatedResponse<Cow>>(`/cows?page=${page}&per_page=${perPage}`)
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
  }, [page, perPage, trigger]);

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

  const createCow = useCallback(async (data: CreateCowInput): Promise<Cow> => {
    setIsSubmitting(true);
    try {
      return await apiPost<Cow>('/cows', data);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateCow = useCallback(async (id: number, data: Partial<CreateCowInput>): Promise<Cow> => {
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
