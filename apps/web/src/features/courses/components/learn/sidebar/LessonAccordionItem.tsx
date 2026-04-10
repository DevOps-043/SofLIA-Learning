"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

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
  onSelectLesson,
  onToggleExpanded,
  expandLabel,
  collapseLabel,
}: LessonAccordionItemProps) {
  const isActive = currentLessonId === lesson.lesson_id;
  const isCompleted = lesson.is_completed;

  return (
    <div className="w-full">
      <div className="flex items-start gap-2">
        <motion.button
          whileHover={{ x: 4 }}
          onClick={() => {
            void onSelectLesson(lesson);
          }}
          className={`group relative flex flex-1 items-center gap-3 overflow-hidden rounded-r-lg border-l-2 px-3 py-2 transition-all duration-200 ${
            isActive
              ? "border-blue-600 bg-blue-50 dark:border-[#00D4B3] dark:bg-[#00D4B3]/10"
              : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          <div
            className={`flex flex-shrink-0 items-center justify-center ${
              isCompleted
                ? "text-blue-700 dark:text-[#00D4B3]"
                : isActive
                  ? "text-blue-700 dark:text-[#00D4B3]"
                  : "text-gray-400 group-hover:text-gray-600 dark:text-white/20 dark:group-hover:text-white/40"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "animate-pulse bg-blue-600 dark:bg-[#00D4B3]" : "bg-current"
                }`}
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
              <span className="mt-1 block text-[10px] font-medium text-blue-700/80 dark:text-[#00D4B3]/80">
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
          className="flex-shrink-0 rounded-md p-2 transition-colors hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
          title={isExpanded ? collapseLabel : expandLabel}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
          )}
        </button>
      </div>

      <LessonSidebarContent
        isExpanded={isExpanded}
        isContentLoaded={isContentLoaded}
        activities={activities}
        materials={materials}
        quizStatus={quizStatus}
      />
    </div>
  );
}
