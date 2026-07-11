'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import type { MilkSummary, MilkRecord, ListResponse } from '@/types';

export function useMilk() {
  const [summary, setSummary] = useState<MilkSummary | null>(null);
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMilk = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summaryRes = await apiGet<MilkSummary>('/milk/summary');
      setSummary(summaryRes);
      
      const recordsRes = await apiGet<ListResponse<MilkRecord>>('/milk/records');
      setRecords(recordsRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data susu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilk();
  }, [fetchMilk]);

  return { summary, records, isLoading, error, refetch: fetchMilk };
}
