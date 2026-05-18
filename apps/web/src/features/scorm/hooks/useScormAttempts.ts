'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ScormAttempt } from '@/lib/scorm/types';

interface UseScormAttemptsOptions {
  packageId: string;
  userId?: string;
}

interface UseScormAttemptsReturn {
  attempts: ScormAttempt[];
  latestAttempt: ScormAttempt | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useScormAttempts({ packageId, userId }: UseScormAttemptsOptions): UseScormAttemptsReturn {
  const [attempts, setAttempts] = useState<ScormAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    try {
      const supabase = createClient();

      let query = supabase
        .from('scorm_attempts')
        .select(SELECT_COLUMNS.scorm_attempts)
        .eq('package_id', packageId)
        .order('attempt_number', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAttempts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los intentos');
    } finally {
      setIsLoading(false);
    }
  }, [packageId, userId]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    await fetchAttempts();
  };

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  return {
    attempts,
    latestAttempt: attempts[0] || null,
    isLoading,
    error,
    refetch
  };
}
