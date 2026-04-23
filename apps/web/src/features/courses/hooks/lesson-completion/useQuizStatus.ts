"use client";

import { useCallback } from "react";

import {
  getUnknownErrorMessage,
  isAbortLikeError,
  isIgnoredNetworkError,
} from "./error.utils";
import { parseQuizStatusApiResponse } from "./response-parsers";
import type { QuizStatusResult } from "./types";

type UseQuizStatusParams = {
  slug: string;
  organizationId: string | null;
};

export function useQuizStatus({ slug, organizationId }: UseQuizStatusParams) {
  return useCallback(
    async (lessonId: string, signal?: AbortSignal): Promise<QuizStatusResult> => {
      try {
        const response = await fetch(buildQuizStatusUrl(slug, lessonId, organizationId), {
          signal,
        });

        if (signal?.aborted) return { canComplete: true };
        if (!response.ok) {
          warnQuizStatusResponse(response);
          return { canComplete: true };
        }

        const data = parseQuizStatusApiResponse(await response.json());
        if (!data.hasRequiredQuizzes || data.allQuizzesPassed) {
          return { canComplete: true };
        }

        return {
          canComplete: false,
          error: "Hace falta realizar actividad",
          details: {
            totalRequired: data.totalRequiredQuizzes ?? 0,
            passed: data.passedQuizzes ?? 0,
            message: `Debes completar y aprobar todos los quizzes obligatorios (${data.passedQuizzes ?? 0}/${data.totalRequiredQuizzes ?? 0} completados)`,
          },
        };
      } catch (error: unknown) {
        if (isAbortLikeError(error, signal)) return { canComplete: true };
        if (isIgnoredNetworkError(error)) {
          warnQuizNetworkError(error);
          return { canComplete: true };
        }

        if (process.env.NODE_ENV === "development") {
          console.error("Error verificando estado de quizzes:", error);
        }
        return { canComplete: true };
      }
    },
    [organizationId, slug]
  );
}

function buildQuizStatusUrl(slug: string, lessonId: string, organizationId: string | null) {
  const orgParam = organizationId ? `?orgId=${encodeURIComponent(organizationId)}` : "";
  return `/api/courses/${slug}/lessons/${lessonId}/quiz/status${orgParam}`;
}

function warnQuizStatusResponse(response: Response) {
  if (response.status === 404 || response.status === 401) return;
  if (process.env.NODE_ENV === "development") {
    console.warn("Error verificando estado de quizzes:", response.status, response.statusText);
  }
}

function warnQuizNetworkError(error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "Error de red verificando estado de quizzes (ignorado):",
      getUnknownErrorMessage(error) ?? ""
    );
  }
}
