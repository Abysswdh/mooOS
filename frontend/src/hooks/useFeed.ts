'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, ApiError } from '@/lib/api';
import type { FeedStock, FeedOrder, ListResponse } from '@/types';

export function useFeed() {
  const [stock, setStock] = useState<FeedStock | null>(null);
  const [orders, setOrders] = useState<FeedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Assuming Axel will make these endpoints
      const stockRes = await apiGet<FeedStock>('/feed/stock');
      setStock(stockRes);
      
      const ordersRes = await apiGet<ListResponse<FeedOrder>>('/feed/orders');
      setOrders(ordersRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data pakan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { stock, orders, isLoading, error, refetch: fetchFeed };
}
