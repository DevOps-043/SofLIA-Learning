import { useEffect, useState } from 'react';
import type { HourDetailData } from './types';

interface UseHourDetailDataParams {
  dayOfWeek: number;
  hour: number;
  isOpen: boolean;
  period: string;
}

export function useHourDetailData({ dayOfWeek, hour, isOpen, period }: UseHourDetailDataParams) {
  const [data, setData] = useState<HourDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/lia-analytics/hour-detail?dayOfWeek=${dayOfWeek}&hour=${hour}&period=${period}`,
        );
        const result = await response.json();
        if (isMounted && result.success) setData(result.data);
      } catch (error) {
        console.error('Error fetching hour detail:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [dayOfWeek, hour, isOpen, period]);

  return { data, isLoading };
}
