"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  LearnActivityMap,
  LearnLesson,
  LearnLessonQuizStatusMap,
  LearnMaterialMap,
  LearnModule,
} from "../types";
import styles from "./CourseSidebar.module.css";
import { LessonAccordionItem } from "./LessonAccordionItem";
import { getModuleProgress, sortLessons } from "./utils";

type ModuleAccordionProps = {
  module: LearnModule;
  moduleIndex: number;
  currentLessonId?: string;
  isExpanded: boolean;
  expandedLessons: Set<string>;
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  lessonsQuizStatus: LearnLessonQuizStatusMap;
  onToggleModule: (moduleId: string) => void;
  onToggleLesson: (lessonId: string) => void | Promise<void>;
  onSelectActivity: (target: {
    activityId: string;
    lesson: LearnLesson;
  }) => void | Promise<void>;
  onSelectMaterial: (target: {
    materialId: string;
    lesson: LearnLesson;
  }) => void | Promise<void>;
  onSelectLesson: (lesson: LearnLesson) => void | Promise<void>;
};

export function ModuleAccordion({
  module,
  moduleIndex,
  currentLessonId,
  isExpanded,
  expandedLessons,
  lessonsActivities,
  lessonsMaterials,
  lessonsQuizStatus,
  onToggleModule,
  onToggleLesson,
  onSelectActivity,
  onSelectMaterial,
  onSelectLesson,
}: ModuleAccordionProps) {
  const { t } = useTranslation("learn");
  const sortedLessons = sortLessons(module.lessons || []);
  const { completedLessons, totalLessons, completionPercentage } =
    getModuleProgress(sortedLessons);
  const hasCurrentLesson = sortedLessons.some(
    (lesson) => lesson.lesson_id === currentLessonId
  );

  return (
    <section className={styles.module}>
      <div className={styles.moduleHeader}>
        <div className={styles.moduleHeading}>
          <span className={styles.moduleEyebrow}>
            Módulo {moduleIndex + 1}
          </span>
          <h3 className={styles.moduleTitle}>
            {module.module_title}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onToggleModule(module.module_id)}
          className={styles.moduleToggle}
          title={
            isExpanded ? t("leftPanel.collapseModule") : t("leftPanel.expandModule")
          }
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp aria-hidden="true" />
          ) : (
            <ChevronDown aria-hidden="true" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={styles.moduleContent}
          >
            <div
              data-tour-id={hasCurrentLesson ? "course-learn--module-progress" : undefined}
              className={styles.moduleProgress}
            >
              <div className={styles.moduleProgressMeta}>
                <span>
                  {completedLessons}/{totalLessons} {t("leftPanel.completed")}
                </span>
                <strong>{completionPercentage}%</strong>
              </div>
              <div className={styles.moduleProgressTrack}>
                <span
                  className={styles.moduleProgressFill}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className={styles.lessonList}>
              {sortedLessons.length > 0 ? (
                sortedLessons.map((lesson) => {
                  const activities = lessonsActivities[lesson.lesson_id] || [];
                  const materials = lessonsMaterials[lesson.lesson_id] || [];
                  const isContentLoaded =
                    lessonsActivities[lesson.lesson_id] !== undefined &&
                    lessonsMaterials[lesson.lesson_id] !== undefined;

                  return (
                    <LessonAccordionItem
                      key={lesson.lesson_id}
                      lesson={lesson}
                      currentLessonId={currentLessonId}
                      isExpanded={expandedLessons.has(lesson.lesson_id)}
                      isContentLoaded={isContentLoaded}
                      activities={activities}
                      materials={materials}
                      quizStatus={lessonsQuizStatus[lesson.lesson_id]}
                      onSelectActivity={onSelectActivity}
                      onSelectMaterial={onSelectMaterial}
                      onSelectLesson={onSelectLesson}
                      onToggleExpanded={onToggleLesson}
                      expandLabel={t("activities.expandCollapse")}
                      collapseLabel={t("activities.collapse")}
                    />
                  );
                })
              ) : (
                <div className={styles.emptyModule}>
                  Este módulo aún no tiene lecciones
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
