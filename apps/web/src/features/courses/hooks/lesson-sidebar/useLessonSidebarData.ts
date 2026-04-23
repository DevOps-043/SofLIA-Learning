"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { LearnLessonTranslationContextMap, LearnLessonQuizStatusMap, LearnActivityMap, LearnMaterialMap } from "../../components/learn/types";
import { buildLessonSidebarDataUrl, buildLessonSidebarPayload } from "./lesson-sidebar-data.utils";

type UseLessonSidebarDataParams = {
  slug: string;
  selectedLang: "es" | "en" | "pt";
  organizationId: string | null;
};

export function useLessonSidebarData({
  slug,
  selectedLang,
  organizationId,
}: UseLessonSidebarDataParams) {
  const [lessonsActivities, setLessonsActivities] = useState<LearnActivityMap>({});
  const [lessonsMaterials, setLessonsMaterials] = useState<LearnMaterialMap>({});
  const [lessonsQuizStatus, setLessonsQuizStatus] = useState<LearnLessonQuizStatusMap>({});
  const [lessonTranslationContexts, setLessonTranslationContexts] = useState<LearnLessonTranslationContextMap>({});
  const lessonsActivitiesRef = useRef(lessonsActivities);
  const lessonsMaterialsRef = useRef(lessonsMaterials);

  useEffect(() => {
    lessonsActivitiesRef.current = lessonsActivities;
  }, [lessonsActivities]);
  useEffect(() => {
    lessonsMaterialsRef.current = lessonsMaterials;
  }, [lessonsMaterials]);

  const loadLessonActivitiesAndMaterials = useCallback(
    async (lessonId: string, forceRefresh = false) => {
      if (!slug) return;

      const currentActivities = lessonsActivitiesRef.current[lessonId];
      const currentMaterials = lessonsMaterialsRef.current[lessonId];
      if (!forceRefresh && currentActivities !== undefined && currentMaterials !== undefined) {
        return;
      }

      try {
        const response = await fetch(buildLessonSidebarDataUrl(slug, lessonId, selectedLang, organizationId), {
          credentials: "include",
        });

        if (!response.ok) {
          applyLessonSidebarFallback(lessonId, setLessonsActivities, setLessonsMaterials, setLessonsQuizStatus, setLessonTranslationContexts);
          return;
        }

        const payload = buildLessonSidebarPayload(await response.json());
        setLessonsActivities((previous) => ({ ...previous, [lessonId]: payload.activities }));
        setLessonsMaterials((previous) => ({ ...previous, [lessonId]: payload.materials }));
        setLessonsQuizStatus((previous) => ({ ...previous, [lessonId]: payload.quizStatus }));
        setLessonTranslationContexts((previous) => ({ ...previous, [lessonId]: payload.translationContext }));
      } catch {
        applyLessonSidebarFallback(lessonId, setLessonsActivities, setLessonsMaterials, setLessonsQuizStatus, setLessonTranslationContexts);
      }
    },
    [organizationId, selectedLang, slug]
  );

  return {
    lessonTranslationContexts,
    lessonsActivities,
    lessonsMaterials,
    lessonsQuizStatus,
    loadLessonActivitiesAndMaterials,
  };
}

function applyLessonSidebarFallback(
  lessonId: string,
  setLessonsActivities: Dispatch<SetStateAction<LearnActivityMap>>,
  setLessonsMaterials: Dispatch<SetStateAction<LearnMaterialMap>>,
  setLessonsQuizStatus: Dispatch<SetStateAction<LearnLessonQuizStatusMap>>,
  setLessonTranslationContexts: Dispatch<SetStateAction<LearnLessonTranslationContextMap>>,
) {
  setLessonsActivities((previous) => ({ ...previous, [lessonId]: [] }));
  setLessonsMaterials((previous) => ({ ...previous, [lessonId]: [] }));
  setLessonsQuizStatus((previous) => ({ ...previous, [lessonId]: null }));
  setLessonTranslationContexts((previous) => ({ ...previous, [lessonId]: null }));
}
