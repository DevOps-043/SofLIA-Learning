"use client";

import { normalizeContentForRenderer } from "../../../../../lib/course-content";
import type { QuizQuestion } from "../quiz.utils";

import type {
  LearnActivity,
  LearnMaterial,
  LessonQuizStatus,
  LessonQuizStatusItem,
} from "../types";

export type QuizPayload = {
  questions: QuizQuestion[];
  totalPoints?: number;
};

function parseJsonIfPossible(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return value;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch {
    return value;
  }
}

export function extractPromptList(rawPrompts: unknown): string[] {
  const parsedPrompts = parseJsonIfPossible(rawPrompts);

  const promptList = Array.isArray(parsedPrompts)
    ? parsedPrompts
    : parsedPrompts === undefined || parsedPrompts === null
      ? []
      : [parsedPrompts];

  return promptList
    .map((prompt) => String(prompt).replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

export function resolveQuizPayload(rawContent: unknown): QuizPayload | null {
  const parsedQuiz = parseJsonIfPossible(rawContent);

  let questions: unknown = parsedQuiz;
  let totalPoints: number | undefined;

  if (
    parsedQuiz &&
    typeof parsedQuiz === "object" &&
    !Array.isArray(parsedQuiz) &&
    "questions" in parsedQuiz
  ) {
    const quizRecord = parsedQuiz as {
      questions?: unknown;
      totalPoints?: unknown;
    };

    questions = quizRecord.questions;
    totalPoints =
      typeof quizRecord.totalPoints === "number"
        ? quizRecord.totalPoints
        : undefined;
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  const hasValidStructure = questions.every(
    (question) =>
      question &&
      typeof question === "object" &&
      ("question" in question || "id" in question)
  );

  if (!hasValidStructure) {
    return null;
  }

  return {
    questions: questions as QuizQuestion[],
    totalPoints,
  };
}

export function getNormalizedActivityContent(activity: LearnActivity): string {
  if (
    activity.activity_type === "quiz" ||
    activity.activity_type === "ai_chat"
  ) {
    return "";
  }

  return normalizeContentForRenderer(activity.activity_content);
}

export function getNormalizedMaterialContent(material: LearnMaterial): string {
  if (material.material_type === "quiz") {
    return "";
  }

  return normalizeContentForRenderer(
    material.content_data ||
      (material.material_type === "reading"
        ? material.material_description
        : "")
  );
}

export function findQuizStatusItem(
  quizStatus: LessonQuizStatus | null,
  itemId: string,
  itemType: "activity" | "material"
): LessonQuizStatusItem | undefined {
  return quizStatus?.quizzes.find(
    (quiz: LessonQuizStatusItem) =>
      quiz.id === itemId && quiz.type === itemType
  );
}
