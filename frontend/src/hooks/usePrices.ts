'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import type { ListResponse } from '@/types';
import type { MarketPrice } from '@/components/features/PriceHistoryChart';

export function usePrices() {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiGet<ListResponse<MarketPrice>>('/prices');
      setPrices(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data harga');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return { prices, isLoading, error, refetch: fetchPrices };
}
