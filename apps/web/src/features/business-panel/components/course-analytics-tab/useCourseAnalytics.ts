import { useCallback, useEffect, useState } from 'react';
import type { CourseAnalyticsResponse } from './types';

interface UseCourseAnalyticsParams {
  courseId: string;
  orgSlug: string;
  refreshKey: number;
}

export function useCourseAnalytics({ courseId, orgSlug, refreshKey }: UseCourseAnalyticsParams) {
  const [analyticsData, setAnalyticsData] = useState<CourseAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/analytics`, {
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await response.json() as CourseAnalyticsResponse;

      if (data.success) {
        setAnalyticsData(data);
      } else {
        setError(data.error || 'Error al obtener analytics del curso');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Error al cargar analytics');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, orgSlug]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics, refreshKey]);

  return { analyticsData, error, fetchAnalytics, isLoading };
}
