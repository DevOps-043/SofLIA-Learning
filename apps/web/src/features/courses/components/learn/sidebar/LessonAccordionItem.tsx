"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useThemeStore } from "@/core/stores/themeStore";

import type {
  LearnActivitySummary,
  LearnLesson,
  LearnMaterialSummary,
  LessonQuizStatus,
} from "../types";
import { LessonSidebarContent } from "./LessonSidebarContent";
import { formatLessonDuration } from "./utils";

type LessonAccordionItemProps = {
  lesson: LearnLesson;
  currentLessonId?: string;
  isExpanded: boolean;
  isContentLoaded: boolean;
  activities: LearnActivitySummary[];
  materials: LearnMaterialSummary[];
  quizStatus: LessonQuizStatus | null | undefined;
  onSelectActivity: (target: {
    activityId: string;
    lesson: LearnLesson;
  }) => void | Promise<void>;
  onSelectMaterial: (target: {
    materialId: string;
    lesson: LearnLesson;
  }) => void | Promise<void>;
  onSelectLesson: (lesson: LearnLesson) => void | Promise<void>;
  onToggleExpanded: (lessonId: string) => void | Promise<void>;
  expandLabel: string;
  collapseLabel: string;
};

export function LessonAccordionItem({
  lesson,
  currentLessonId,
  isExpanded,
  isContentLoaded,
  activities,
  materials,
  quizStatus,
  onSelectActivity,
  onSelectMaterial,
  onSelectLesson,
  onToggleExpanded,
  expandLabel,
  collapseLabel,
}: LessonAccordionItemProps) {
  const isActive = currentLessonId === lesson.lesson_id;
  const isCompleted = lesson.is_completed;
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  return (
    <div className="w-full">
      <div className="flex items-start gap-2">
        <motion.button
          data-tour-id={isActive ? "course-learn--current-lesson" : undefined}
          whileHover={{ x: 4 }}
          onClick={() => {
            void onSelectLesson(lesson);
          }}
          className={`group relative flex flex-1 items-center gap-3 overflow-hidden rounded-r-lg border-l-2 px-3 py-2 transition-all duration-200 ${
            isActive
              ? isDark ? '' : 'border-blue-600 bg-blue-50'
              : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
          style={isActive && isDark ? {
            borderColor: 'var(--learn-accent)',
            backgroundColor: 'color-mix(in srgb, var(--learn-accent) 10%, transparent)',
          } : undefined}
        >
          <div
            className={`flex flex-shrink-0 items-center justify-center ${
              isCompleted || isActive
                ? isDark ? '' : 'text-blue-700'
                : "text-gray-400 group-hover:text-gray-600 dark:text-white/20 dark:group-hover:text-white/40"
            }`}
            style={(isCompleted || isActive) && isDark ? { color: 'var(--learn-accent)' } : undefined}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <div
                className={`h-1.5 w-1.5 rounded-full ${isActive ? 'animate-pulse' : 'bg-current'} ${isActive && !isDark ? 'bg-blue-600' : ''}`}
                style={isActive && isDark ? { backgroundColor: 'var(--learn-accent)' } : undefined}
              />
            )}
          </div>

          <div className="z-10 min-w-0 flex-1 text-left">
            <p
              className={`line-clamp-2 text-sm leading-snug ${
                isActive
                  ? "font-medium text-blue-800 dark:text-white"
                  : "font-normal text-gray-600 group-hover:text-gray-900 dark:text-white/60 dark:group-hover:text-white/90"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {lesson.lesson_title}
            </p>

            {isActive && (
              <span
                className={`mt-1 block text-[10px] font-medium ${!isDark ? 'text-blue-700/80' : ''}`}
                style={isDark ? { color: 'color-mix(in srgb, var(--learn-accent) 80%, transparent)' } : undefined}
              >
                En curso • {formatLessonDuration(lesson.duration_seconds)}
              </span>
            )}
          </div>
        </motion.button>

        <button
          onClick={(event) => {
            event.stopPropagation();
            void onToggleExpanded(lesson.lesson_id);
          }}
          className="flex-shrink-0 rounded-md p-2 transition-colors hover:bg-gray-200/50 dark:hover:bg-primary/30"
          title={isExpanded ? collapseLabel : expandLabel}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500 dark:text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-white/60" />
          )}
        </button>
      </div>

      <LessonSidebarContent
        isExpanded={isExpanded}
        isContentLoaded={isContentLoaded}
        activities={activities}
        materials={materials}
        quizStatus={quizStatus}
        onSelectActivity={(activityId) => {
          void onSelectActivity({ activityId, lesson });
        }}
        onSelectMaterial={(materialId) => {
          void onSelectMaterial({ materialId, lesson });
        }}
      />
    </div>
  );
}
