import { useCallback, useEffect, useState } from 'react';
import { fetchLessonContent } from './lesson-content-api';
import type { LessonContentSnapshot } from './types';

interface UseLessonContentStateParams {
  lessonId?: string;
  organizationId?: string | null;
  selectedLang: string;
  slug: string;
}

const emptySnapshot: LessonContentSnapshot = {
  activities: [],
  materials: [],
  quizStatus: null,
};

export function useLessonContentState({
  lessonId,
  organizationId,
  selectedLang,
  slug,
}: UseLessonContentStateParams) {
  const [snapshot, setSnapshot] = useState<LessonContentSnapshot>(emptySnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLessonContent = useCallback(
    async ({ preserveVisibleContent = false }: { preserveVisibleContent?: boolean } = {}) => {
      if (!lessonId || !slug) {
        setSnapshot(emptySnapshot);
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
        const nextSnapshot = await fetchLessonContent({ lessonId, organizationId, selectedLang, slug });
        setSnapshot(nextSnapshot);
      } catch {
        if (!preserveVisibleContent) {
          setSnapshot(emptySnapshot);
        }
      } finally {
        setIsRefreshing(false);
        setLoading(false);
      }
    },
    [lessonId, organizationId, selectedLang, slug]
  );

  useEffect(() => {
    void loadLessonContent();
  }, [loadLessonContent]);

  return {
    ...snapshot,
    isRefreshing,
    loadLessonContent,
    loading,
  };
}
