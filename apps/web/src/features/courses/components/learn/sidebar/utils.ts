"use client";

import type {
  LearnLesson,
  LearnModule,
  LessonQuizStatus,
  LessonQuizStatusItem,
} from "../types";

const MODULE_NUMBER_FALLBACK = 999;

export function extractModuleNumber(title: string): number {
  const match = title.match(/m[oó]dulo\s*(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : MODULE_NUMBER_FALLBACK;
}

export function sortModules(modules: LearnModule[]): LearnModule[] {
  return [...modules].sort((left, right) => {
    const leftNumber = extractModuleNumber(left.module_title);
    const rightNumber = extractModuleNumber(right.module_title);

    if (
      leftNumber !== MODULE_NUMBER_FALLBACK &&
      rightNumber !== MODULE_NUMBER_FALLBACK
    ) {
      return leftNumber - rightNumber;
    }

    if (
      leftNumber !== MODULE_NUMBER_FALLBACK &&
      rightNumber === MODULE_NUMBER_FALLBACK
    ) {
      return -1;
    }

    if (
      leftNumber === MODULE_NUMBER_FALLBACK &&
      rightNumber !== MODULE_NUMBER_FALLBACK
    ) {
      return 1;
    }

    const orderDifference =
      (left.module_order_index || 0) - (right.module_order_index || 0);

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return left.module_title.localeCompare(right.module_title);
  });
}

export function sortLessons(lessons: LearnLesson[]): LearnLesson[] {
  return [...lessons].sort(
    (left, right) => (left.lesson_order_index || 0) - (right.lesson_order_index || 0)
  );
}

export function getModuleProgress(lessons: LearnLesson[]) {
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((lesson) => lesson.is_completed).length;
  const completionPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    completedLessons,
    totalLessons,
    completionPercentage,
  };
}

export function formatLessonDuration(durationSeconds?: number) {
  const safeDuration =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : 0;
  const minutes = Math.floor(safeDuration / 60);
  const seconds = safeDuration % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getQuizStatusItem(
  quizStatus: LessonQuizStatus | null | undefined,
  itemId: string,
  type: "activity" | "material"
): LessonQuizStatusItem | null {
  if (!quizStatus?.quizzes?.length) {
    return null;
  }

  return quizStatus.quizzes.find(
    (quiz) => quiz.id === itemId && quiz.type === type
  ) ?? null;
}
