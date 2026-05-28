import { useCallback, useEffect, useState } from 'react';
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

  const loadLessonContent = useCallback(
    async ({
      forceRefresh = false,
      preserveVisibleContent = false,
    }: {
      forceRefresh?: boolean;
      preserveVisibleContent?: boolean;
    } = {}) => {
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
        setSnapshot(nextSnapshot);
      } catch {
        if (!preserveVisibleContent) {
          setSnapshot(emptyLessonContentSnapshot);
        }
      } finally {
        setIsRefreshing(false);
        setLoading(false);
      }
    },
    [lessonId, organizationId, selectedLang, slug]
  );

  useEffect(() => {
    if (initialContent) {
      setSnapshot(initialContent);
      setIsRefreshing(false);
      setLoading(false);
      return;
    }

    void loadLessonContent();
  }, [initialContent, loadLessonContent]);

  return {
    ...snapshot,
    isRefreshing,
    loadLessonContent,
    loading,
  };
}
