import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emptyLessonContentSnapshot,
  fetchLessonContentSnapshot,
} from '../../../../services/lesson-content.client';
import type { LessonContentSnapshot } from './types';

interface UseLessonContentStateParams {
  initialContent?: LessonContentSnapshot | null;
  lessonId?: string;
  organizationId?: string | null;
  selectedLang: string;
  slug: string;
}

export function useLessonContentState({
  initialContent,
  lessonId,
  organizationId,
  selectedLang,
  slug,
}: UseLessonContentStateParams) {
  const [snapshot, setSnapshot] = useState<LessonContentSnapshot>(
    initialContent ?? emptyLessonContentSnapshot,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(!initialContent);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const loadLessonContent = useCallback(
    async ({
      forceRefresh = false,
      preserveVisibleContent = false,
    }: {
      forceRefresh?: boolean;
      preserveVisibleContent?: boolean;
    } = {}) => {
      const version = ++requestVersion.current;
      setError(null);
      if (!lessonId || !slug) {
        setSnapshot(emptyLessonContentSnapshot);
        setIsRefreshing(false);
        setLoading(false);
        return;
      }

      try {
        if (preserveVisibleContent) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        const nextSnapshot = await fetchLessonContentSnapshot({
          forceRefresh,
          lessonId,
          organizationId,
          selectedLang,
          slug,
        });
        if (version !== requestVersion.current) return;
        setSnapshot(nextSnapshot);
      } catch {
        if (version !== requestVersion.current) return;
        setError('No se pudieron cargar las actividades. Vuelve a intentarlo.');
        if (!preserveVisibleContent) {
          setSnapshot(emptyLessonContentSnapshot);
        }
      } finally {
        if (version === requestVersion.current) {
          setIsRefreshing(false);
          setLoading(false);
        }
      }
    },
    [lessonId, organizationId, selectedLang, slug]
  );

  useEffect(() => {
    // Invalidate requests from the previous lesson or an older refresh.
    requestVersion.current += 1;
    setError(null);
    if (initialContent) {
      setSnapshot(initialContent);
      setIsRefreshing(false);
      setLoading(false);
    } else {
      setSnapshot(emptyLessonContentSnapshot);
      void loadLessonContent();
    }
    return () => { requestVersion.current += 1; };
  }, [initialContent, loadLessonContent]);

  return {
    ...snapshot,
    error,
    isRefreshing,
    loadLessonContent,
    loading,
  };
}
