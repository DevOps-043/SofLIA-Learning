"use client";

import type {
  CourseQuestion,
  QuestionReactionResult,
} from "./types";

type FetchCourseQuestionsOptions = {
  lessonId: string;
  limit: number;
  offset: number;
  search?: string;
  slug: string;
};

function normalizeQuestions(payload: unknown): CourseQuestion[] {
  return Array.isArray(payload) ? (payload as CourseQuestion[]) : [];
}

export async function fetchCourseQuestions({
  lessonId,
  limit,
  offset,
  search,
  slug,
}: FetchCourseQuestionsOptions) {
  const params = new URLSearchParams();
  if (search) {
    params.append("search", search);
  }
  params.append("lessonId", lessonId);
  params.append("limit", String(limit));
  params.append("offset", String(offset));

  const response = await fetch(`/api/courses/${slug}/questions?${params.toString()}`);
  if (!response.ok) {
    return [];
  }

  return normalizeQuestions(await response.json());
}

export async function fetchQuestionById({
  questionId,
  slug,
}: {
  questionId: string;
  slug: string;
}) {
  const response = await fetch(`/api/courses/${slug}/questions/${questionId}`);

  // 404 = la pregunta no pertenece a la comunidad del usuario (otra organización)
  // o fue eliminada: no es un error recuperable, simplemente no es visible.
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch course question");
  }

  return (await response.json()) as CourseQuestion;
}

export async function toggleQuestionReaction({
  questionId,
  slug,
}: {
  questionId: string;
  slug: string;
}) {
  const response = await fetch(
    `/api/courses/${slug}/questions/${questionId}/reactions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reaction_type: "like",
        action: "toggle",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to toggle question reaction");
  }

  return (await response.json()) as QuestionReactionResult;
}
