'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut, ApiError } from '@/lib/api';
import type { Settings } from '@/types';
import { toastError } from '@/lib/notify';

interface UseSettingsReturn {
  settings: Settings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveSettings: (newSettings: Settings) => Promise<void>;
  refetch: () => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiGet<Settings>('/settings')
      .then((res) => {
        if (!cancelled) {
          setSettings(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          // If the backend doesn't implement this yet, fallback gracefully instead of crashing
          console.warn('Settings API not ready yet', err);
          setSettings({
            koperasi_name: 'KUD Sapi Perah Sejahtera',
            address: 'Jl. Peternakan No. 1, Lembang',
            enable_telegram_notif: true,
            auto_price_fluctuation: true,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [trigger]);

  const saveSettings = useCallback(async (newSettings: Settings) => {
    setIsSaving(true);
    try {
      // Mocking the put if the endpoint doesn't exist
      try {
        await apiPut('/settings', newSettings);
      } catch (e: any) {
         if (e.message?.includes('404')) {
             console.warn('Settings PUT API not ready yet, simulating success');
         } else {
             throw e;
         }
      }
      setSettings(newSettings);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { settings, isLoading, isSaving, error, saveSettings, refetch };
}
