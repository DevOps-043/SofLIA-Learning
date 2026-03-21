'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type {
  SofLIAPersonalizationSettings,
  SofLIAPersonalizationSettingsInput,
} from '../types/soflia-personalization.types';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface UseSofLIAPersonalizationReturn {
  settings: SofLIAPersonalizationSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (settings: SofLIAPersonalizationSettingsInput) => Promise<void>;
  resetSettings: () => Promise<void>;
  refetch: () => Promise<void>;
}

const fetcher = async (url: string): Promise<SofLIAPersonalizationSettings | null> => {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return null; // No hay configuración, retornar null
    }
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(errorData.error || errorData.message || 'Error al cargar configuración');
    (error as any).status = res.status;
    throw error;
  }

  const result = await res.json();
  return result.settings || null;
};

export function useSofLIAPersonalization(): UseSofLIAPersonalizationReturn {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: settings, error, isLoading, mutate } = useSWR<SofLIAPersonalizationSettings | null>(
    user?.id ? '/api/lia/personalization' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
      refreshInterval: 0,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      fallbackData: null,
    }
  );

  const updateSettings = useCallback(
    async (newSettings: SofLIAPersonalizationSettingsInput) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      setIsUpdating(true);
      try {
        const res = await fetch('/api/lia/personalization', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSettings),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errorData.error || errorData.message || 'Error al actualizar configuración');
        }

        const result = await res.json();
        
        // Actualizar cache optimísticamente
        await mutate(result.settings, false);
      } finally {
        setIsUpdating(false);
      }
    },
    [user?.id, mutate]
  );

  const resetSettings = useCallback(async () => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado');
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/lia/personalization', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errorData.error || errorData.message || 'Error al restablecer configuración');
      }

      // Limpiar cache
      await mutate(null, false);
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, mutate]);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    settings: settings ?? null,
    loading: isLoading || isUpdating,
    error: error?.message ?? null,
    updateSettings,
    resetSettings,
    refetch,
  };
}
