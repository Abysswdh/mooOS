'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import type { WasteSummary, WasteBatch, ListResponse } from '@/types';

export function useWaste() {
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [batches, setBatches] = useState<WasteBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaste = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summaryRes = await apiGet<WasteSummary>('/waste/summary');
      setSummary(summaryRes);
      
      const batchesRes = await apiGet<ListResponse<WasteBatch>>('/waste/batches');
      setBatches(batchesRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data limbah');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaste();
  }, [fetchWaste]);

  return { summary, batches, isLoading, error, refetch: fetchWaste };
}
