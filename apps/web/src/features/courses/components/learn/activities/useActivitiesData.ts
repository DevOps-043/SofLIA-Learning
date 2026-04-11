"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ContentTranslationService } from "../../../../../core/services/contentTranslation.service";
import { useCurrentOrganizationId } from "../../../../../core/stores/organizationStore";
import {
  normalizeContentForRenderer,
  normalizeLessonActivityRecord,
  normalizeLessonMaterialRecord,
} from "../../../../../lib/course-content";

import { extractPromptList } from "./utils";
import type {
  GenerateRoleBasedPrompts,
  LearnActivity,
  LearnMaterial,
  LessonQuizStatus,
} from "../types";

type UseActivitiesDataOptions = {
  lessonId?: string;
  slug: string;
  selectedLang: string;
  onPromptsChange?: (prompts: string[]) => void;
  userRole?: string;
  generateRoleBasedPrompts?: GenerateRoleBasedPrompts;
  onLessonContentRefresh?: (
    lessonId: string,
    forceRefresh?: boolean
  ) => void | Promise<void>;
};

type TranslationLanguage = Parameters<
  typeof ContentTranslationService.translateArray
>[3];

function toActivityArray(payload: unknown): LearnActivity[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((activity) =>
    normalizeLessonActivityRecord(activity as LearnActivity)
  );
}

function toMaterialArray(payload: unknown): LearnMaterial[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((material) =>
    normalizeLessonMaterialRecord(material as LearnMaterial)
  );
}

export function useActivitiesData({
  lessonId,
  slug,
  selectedLang,
  onPromptsChange,
  userRole,
  generateRoleBasedPrompts,
  onLessonContentRefresh,
}: UseActivitiesDataOptions) {
  const organizationId = useCurrentOrganizationId();
  const [activities, setActivities] = useState<LearnActivity[]>([]);
  const [materials, setMaterials] = useState<LearnMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(
    new Set()
  );
  const [collapsedMaterials, setCollapsedMaterials] = useState<Set<string>>(
    new Set()
  );
  const [activitiesInitialized, setActivitiesInitialized] = useState(false);
  const [materialsInitialized, setMaterialsInitialized] = useState(false);
  const [quizStatus, setQuizStatus] = useState<LessonQuizStatus | null>(null);
  const [lessonFeedback, setLessonFeedback] = useState<
    "like" | "dislike" | null
  >(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const generateRoleBasedPromptsRef = useRef(generateRoleBasedPrompts);
  const onPromptsChangeRef = useRef(onPromptsChange);

  useEffect(() => {
    generateRoleBasedPromptsRef.current = generateRoleBasedPrompts;
  }, [generateRoleBasedPrompts]);

  useEffect(() => {
    onPromptsChangeRef.current = onPromptsChange;
  }, [onPromptsChange]);

  useEffect(() => {
    setActivitiesInitialized(false);
    setMaterialsInitialized(false);
    setCollapsedActivities(new Set());
    setCollapsedMaterials(new Set());
  }, [lessonId]);

  useEffect(() => {
    if (activities.length > 0 && !activitiesInitialized) {
      setCollapsedActivities(new Set(activities.map((item) => item.activity_id)));
      setActivitiesInitialized(true);
    }
  }, [activities, activitiesInitialized]);

  useEffect(() => {
    if (materials.length > 0 && !materialsInitialized) {
      setCollapsedMaterials(new Set(materials.map((item) => item.material_id)));
      setMaterialsInitialized(true);
    }
  }, [materials, materialsInitialized]);

  const loadLessonContent = useCallback(async () => {
    if (!lessonId || !slug) {
      setActivities([]);
      setMaterials([]);
      setQuizStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const quizStatusUrl = organizationId
        ? `/api/courses/${slug}/lessons/${lessonId}/quiz/status?orgId=${encodeURIComponent(
            organizationId
          )}`
        : `/api/courses/${slug}/lessons/${lessonId}/quiz/status`;

      const [activitiesResponse, materialsResponse, quizStatusResponse] =
        await Promise.all([
          fetch(`/api/courses/${slug}/lessons/${lessonId}/activities`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`/api/courses/${slug}/lessons/${lessonId}/materials`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(quizStatusUrl, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      if (activitiesResponse.ok) {
        let activitiesData = await activitiesResponse.json();

        if (
          selectedLang !== "es" &&
          Array.isArray(activitiesData) &&
          activitiesData.length > 0
        ) {
          activitiesData = await ContentTranslationService.translateArray(
            "activity",
            activitiesData.map((activity) => ({
              ...(activity as Record<string, unknown>),
              id: (activity as { activity_id?: string }).activity_id,
            })),
            ["activity_title", "activity_description", "activity_content"],
            selectedLang as TranslationLanguage
          );
        }

        setActivities(toActivityArray(activitiesData));
      } else {
        setActivities([]);
      }

      if (materialsResponse.ok) {
        setMaterials(toMaterialArray(await materialsResponse.json()));
      } else {
        setMaterials([]);
      }

      if (quizStatusResponse.ok) {
        setQuizStatus((await quizStatusResponse.json()) as LessonQuizStatus);
      } else {
        setQuizStatus(null);
      }
    } catch {
      setActivities([]);
      setMaterials([]);
      setQuizStatus(null);
    } finally {
      setLoading(false);
    }
  }, [lessonId, organizationId, selectedLang, slug]);

  useEffect(() => {
    void loadLessonContent();
  }, [loadLessonContent]);

  useEffect(() => {
    async function loadLessonFeedback() {
      if (!lessonId || !slug) {
        setLessonFeedback(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/courses/${slug}/lessons/${lessonId}/feedback`,
          { credentials: "include" }
        );

        if (!response.ok) {
          setLessonFeedback(null);
          return;
        }

        const data = (await response.json()) as { feedback_type?: unknown };
        setLessonFeedback(
          data.feedback_type === "like" || data.feedback_type === "dislike"
            ? data.feedback_type
            : null
        );
      } catch {
        setLessonFeedback(null);
      }
    }

    void loadLessonFeedback();
  }, [lessonId, slug]);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: number | null = null;

    async function processPrompts() {
      const promptSources = activities
        .map((activity) => {
          const prompts = extractPromptList(activity.ai_prompts);

          if (prompts.length === 0) {
            return null;
          }

          return {
            prompts,
            content: normalizeContentForRenderer(activity.activity_content),
            title: activity.activity_title || "",
          };
        })
        .filter(Boolean) as Array<{
        prompts: string[];
        content: string;
        title: string;
      }>;

      if (promptSources.length === 0 || !onPromptsChangeRef.current) {
        onPromptsChangeRef.current?.([]);
        return;
      }

      const generatePrompts = generateRoleBasedPromptsRef.current;
      const shouldAdaptPrompts = Boolean(userRole && generatePrompts);

      let allPrompts: string[] = [];

      if (shouldAdaptPrompts && generatePrompts) {
        const originalPrompts = promptSources.map((source) => source.prompts);
        const timeoutPromise = new Promise<string[][]>((resolve) => {
          timeoutId = window.setTimeout(() => resolve(originalPrompts), 10000);
        });

        try {
          const results = await Promise.race([
            Promise.all(
              promptSources.map((source) =>
                generatePrompts(
                  source.prompts,
                  source.content,
                  source.title,
                  userRole
                ).catch(() => source.prompts)
              )
            ),
            timeoutPromise,
          ]);

          allPrompts = results.flat();
        } catch {
          allPrompts = originalPrompts.flat();
        }
      } else {
        allPrompts = promptSources.flatMap((source) => source.prompts);
      }

      if (isMounted) {
        onPromptsChangeRef.current?.(allPrompts);
      }
    }

    void processPrompts();

    return () => {
      isMounted = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activities, userRole]);

  const toggleActivityCollapse = useCallback((activityId: string) => {
    setCollapsedActivities((currentCollapsedActivities) => {
      const nextCollapsedActivities = new Set(currentCollapsedActivities);

      if (nextCollapsedActivities.has(activityId)) {
        nextCollapsedActivities.delete(activityId);
      } else {
        nextCollapsedActivities.add(activityId);
      }

      return nextCollapsedActivities;
    });
  }, []);

  const toggleMaterialCollapse = useCallback((materialId: string) => {
    setCollapsedMaterials((currentCollapsedMaterials) => {
      const nextCollapsedMaterials = new Set(currentCollapsedMaterials);

      if (nextCollapsedMaterials.has(materialId)) {
        nextCollapsedMaterials.delete(materialId);
      } else {
        nextCollapsedMaterials.add(materialId);
      }

      return nextCollapsedMaterials;
    });
  }, []);

  const refreshLessonContent = useCallback(async () => {
    await loadLessonContent();

    if (lessonId && onLessonContentRefresh) {
      await onLessonContentRefresh(lessonId, true);
    }
  }, [lessonId, loadLessonContent, onLessonContentRefresh]);

  const handleLessonFeedback = useCallback(
    async (feedbackType: "like" | "dislike") => {
      if (!lessonId || !slug || feedbackLoading) {
        return;
      }

      setFeedbackLoading(true);

      try {
        const response = await fetch(
          `/api/courses/${slug}/lessons/${lessonId}/feedback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ feedback_type: feedbackType }),
          }
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { feedback_type?: unknown };
        setLessonFeedback(
          data.feedback_type === "like" || data.feedback_type === "dislike"
            ? data.feedback_type
            : null
        );
      } finally {
        setFeedbackLoading(false);
      }
    },
    [feedbackLoading, lessonId, slug]
  );

  return {
    activities,
    collapsedActivities,
    collapsedMaterials,
    feedbackLoading,
    handleLessonFeedback,
    lessonFeedback,
    loading,
    materials,
    quizStatus,
    refreshLessonContent,
    toggleActivityCollapse,
    toggleMaterialCollapse,
  };
}
