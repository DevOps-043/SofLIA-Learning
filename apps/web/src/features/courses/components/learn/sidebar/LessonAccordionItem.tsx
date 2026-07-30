"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

import type {
  LearnActivitySummary,
  LearnLesson,
  LearnMaterialSummary,
  LessonQuizStatus,
} from "../types";
import styles from "./CourseSidebar.module.css";
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

  return (
    <div className={styles.lesson}>
      <div className={styles.lessonRowWrap}>
        <motion.button
          type="button"
          data-tour-id={isActive ? "course-learn--current-lesson" : undefined}
          onClick={() => {
            void onSelectLesson(lesson);
          }}
          className={`${styles.lessonRow} ${
            isActive ? styles.lessonRowActive : ""
          }`}
        >
          <div
            className={`${styles.lessonState} ${
              isCompleted || isActive ? styles.lessonStateActive : ""
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <span className={styles.lessonDot} />
            )}
          </div>

          <div className={styles.lessonText}>
            <p className={styles.lessonTitle}>
              {lesson.lesson_title}
            </p>

            {isActive && (
              <span className={styles.lessonStatus}>
                En curso · {formatLessonDuration(lesson.duration_seconds)}
              </span>
            )}
          </div>
        </motion.button>

        <button
          onClick={(event) => {
            event.stopPropagation();
            void onToggleExpanded(lesson.lesson_id);
          }}
          className={styles.lessonToggle}
          title={isExpanded ? collapseLabel : expandLabel}
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp aria-hidden="true" />
          ) : (
            <ChevronDown aria-hidden="true" />
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
