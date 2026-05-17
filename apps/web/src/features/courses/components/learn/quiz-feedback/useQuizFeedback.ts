"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useOrganizationStore } from "@/core/stores/organizationStore";

import type {
  QuizFeedbackEntry,
  QuizFeedbackRequest,
  QuizFeedbackState,
} from "./quiz-feedback.types";

type QuizFeedbackApiResponse = {
  feedback?: {
    content?: string;
    createdAt?: string;
    promptHash?: string;
    updatedAt?: string;
  };
  error?: string;
  source?: "cache" | "generated";
};

type UseQuizFeedbackOptions = {
  courseSlug?: string | null;
  lessonId?: string | null;
};

type StoredQuizFeedbackEntry = {
  content: string;
  createdAt: string;
  prompt: string;
  updatedAt: string;
};

type StoredQuizFeedbackState = {
  entries: Record<string, StoredQuizFeedbackEntry>;
  lessonId: string;
  version: 1;
};

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "soflia:quiz-feedback:v1";

function buildStorageKey(lessonId: string): string {
  return `${STORAGE_PREFIX}:${lessonId}`;
}

function buildPromptId(prompt: string): string {
  let hash = 0;

  for (let index = 0; index < prompt.length; index += 1) {
    hash = Math.imul(31, hash) + prompt.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function readStoredFeedback(lessonId?: string | null): Record<string, QuizFeedbackEntry> {
  if (!lessonId || typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(buildStorageKey(lessonId));

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as Partial<StoredQuizFeedbackState>;

    if (
      parsedValue.version !== STORAGE_VERSION ||
      parsedValue.lessonId !== lessonId ||
      !parsedValue.entries ||
      typeof parsedValue.entries !== "object"
    ) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue.entries)
        .filter(([, entry]) => Boolean(entry?.content && entry.prompt))
        .map(([promptId, entry]) => [
          promptId,
          {
            content: entry.content,
            createdAt: entry.createdAt,
            error: null,
            isLoading: false,
            prompt: entry.prompt,
            updatedAt: entry.updatedAt,
          },
        ]),
    );
  } catch (error) {
    console.warn("[QuizFeedback] No fue posible leer retroalimentaciones locales.", error);
    return {};
  }
}

function persistStoredFeedback(
  lessonId: string | null | undefined,
  feedbackByPromptId: Record<string, QuizFeedbackEntry>,
) {
  if (!lessonId || typeof window === "undefined") {
    return;
  }

  const entries = Object.fromEntries(
    Object.entries(feedbackByPromptId)
      .filter(([, entry]) => Boolean(entry.content))
      .map(([promptId, entry]) => [
        promptId,
        {
          content: entry.content || "",
          createdAt: entry.createdAt,
          prompt: entry.prompt,
          updatedAt: entry.updatedAt,
        },
      ]),
  );

  try {
    window.localStorage.setItem(
      buildStorageKey(lessonId),
      JSON.stringify({
        entries,
        lessonId,
        version: STORAGE_VERSION,
      } satisfies StoredQuizFeedbackState),
    );
  } catch (error) {
    console.warn("[QuizFeedback] No fue posible guardar retroalimentaciones locales.", error);
  }
}

export function useQuizFeedback({ courseSlug, lessonId }: UseQuizFeedbackOptions = {}) {
  const currentOrganization = useOrganizationStore(
    (state) => state.currentOrganization
  );
  const abortControllersRef = useRef(new Map<string, AbortController>());
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackByPromptId, setFeedbackByPromptId] = useState<
    Record<string, QuizFeedbackEntry>
  >(() => readStoredFeedback(lessonId));

  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach((abortController) => {
        abortController.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setFeedbackByPromptId(readStoredFeedback(lessonId));
    setActivePromptId(null);
    setIsOpen(false);
  }, [lessonId]);

  useEffect(() => {
    persistStoredFeedback(lessonId, feedbackByPromptId);
  }, [feedbackByPromptId, lessonId]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const requestFeedback = useCallback(
    async ({
      activityId,
      force = false,
      materialId,
      prompt,
      courseContext,
    }: QuizFeedbackRequest) => {
      const normalizedPrompt = prompt.trim();

      if (!normalizedPrompt) {
        return;
      }

      const promptId = buildPromptId(normalizedPrompt);
      const existingFeedback = feedbackByPromptId[promptId];
      if (existingFeedback && !force) {
        setActivePromptId(promptId);
        setIsOpen(true);
        return;
      }

      abortControllersRef.current.get(promptId)?.abort();
      const abortController = new AbortController();
      abortControllersRef.current.set(promptId, abortController);
      const now = new Date().toISOString();

      setActivePromptId(promptId);
      setIsOpen(true);
      setFeedbackByPromptId((currentFeedback) => {
        const currentEntry = currentFeedback[promptId];

        return {
          ...currentFeedback,
          [promptId]: {
            content: currentEntry?.content ?? null,
            createdAt: currentEntry?.createdAt ?? now,
            error: null,
            isLoading: true,
            prompt: normalizedPrompt,
            updatedAt: now,
          },
        };
      });

      try {
        if (!courseSlug || !lessonId) {
          throw new Error("No se pudo identificar la leccion para recuperar retroalimentacion.");
        }

        const response = await fetch(
          `/api/courses/${courseSlug}/lessons/${lessonId}/quiz/feedback`,
          {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activityId,
            courseContext,
            materialId,
            organizationId: currentOrganization?.id,
            prompt: normalizedPrompt,
          }),
          signal: abortController.signal,
          },
        );

        const payload = (await response.json()) as QuizFeedbackApiResponse;

        if (!response.ok) {
          throw new Error(payload.error || "No fue posible generar la retroalimentacion.");
        }

        const content = payload.feedback?.content;

        if (!content) {
          throw new Error("SofLIA no devolvio retroalimentacion.");
        }

        setFeedbackByPromptId((currentFeedback) => {
          const currentEntry = currentFeedback[promptId];
          const updatedAt = new Date().toISOString();

          return {
            ...currentFeedback,
            [promptId]: {
              content,
              createdAt: payload.feedback?.createdAt ?? currentEntry?.createdAt ?? updatedAt,
              error: null,
              isLoading: false,
              prompt: normalizedPrompt,
              updatedAt: payload.feedback?.updatedAt ?? updatedAt,
            },
          };
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setFeedbackByPromptId((currentFeedback) => {
          const currentEntry = currentFeedback[promptId];
          const updatedAt = new Date().toISOString();

          return {
            ...currentFeedback,
            [promptId]: {
              content: currentEntry?.content ?? null,
              createdAt: currentEntry?.createdAt ?? updatedAt,
              error:
                error instanceof Error
                  ? error.message
                  : "No fue posible generar la retroalimentacion.",
              isLoading: false,
              prompt: normalizedPrompt,
              updatedAt,
            },
          };
        });
      } finally {
        if (abortControllersRef.current.get(promptId) === abortController) {
          abortControllersRef.current.delete(promptId);
        }
      }
    },
    [courseSlug, currentOrganization?.id, feedbackByPromptId, lessonId]
  );

  const activeFeedback = activePromptId ? feedbackByPromptId[activePromptId] : null;
  const state: QuizFeedbackState = {
    activePrompt: activeFeedback?.prompt ?? null,
    activePromptId,
    content: activeFeedback?.content ?? null,
    createdAt: activeFeedback?.createdAt ?? "",
    error: activeFeedback?.error ?? null,
    isLoading: activeFeedback?.isLoading ?? false,
    isOpen,
    prompt: activeFeedback?.prompt ?? "",
    updatedAt: activeFeedback?.updatedAt ?? "",
  };

  return {
    ...state,
    close,
    requestFeedback,
  };
}
