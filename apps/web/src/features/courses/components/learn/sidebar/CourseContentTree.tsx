"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Layers, PanelLeftClose } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  LearnActivityMap,
  LearnLesson,
  LearnLessonQuizStatusMap,
  LearnMaterialMap,
  LearnModule,
} from "../types";
import { ModuleAccordion } from "./ModuleAccordion";
import styles from "./CourseSidebar.module.css";
import { sortModules } from "./utils";

type CourseContentTreeProps = {
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isCollapsed: boolean;
  expandedLessons: Set<string>;
  expandedModules: Set<string>;
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  lessonsQuizStatus: LearnLessonQuizStatusMap;
  onToggleCollapsed: () => void;
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
  onClosePanel?: () => void;
  showHeader?: boolean;
};

export function CourseContentTree({
  modules,
  currentLesson,
  isCollapsed,
  expandedLessons,
  expandedModules,
  lessonsActivities,
  lessonsMaterials,
  lessonsQuizStatus,
  onToggleCollapsed,
  onToggleModule,
  onToggleLesson,
  onSelectActivity,
  onSelectMaterial,
  onSelectLesson,
  onClosePanel,
  showHeader = true,
}: CourseContentTreeProps) {
  const { t } = useTranslation("learn");
  const sortedModules = sortModules(modules);

  return (
    <div data-tour-id="course-learn--content-tree" className={styles.tree}>
      {showHeader ? (
        <div className={styles.treeHeader}>
          <h3 className={styles.treeTitle}>
            <Layers aria-hidden="true" />
            <span>{t("leftPanel.content")}</span>
          </h3>

          <div className={styles.treeActions}>
            {onClosePanel ? (
              <button
                type="button"
                onClick={onClosePanel}
                aria-label={t("leftPanel.closePanel")}
                title={t("leftPanel.closePanel")}
                className={styles.treeAction}
              >
                <PanelLeftClose aria-hidden="true" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onToggleCollapsed}
              className={styles.treeAction}
              aria-label={
                isCollapsed
                  ? t("leftPanel.expandContent")
                  : t("leftPanel.collapseContent")
              }
              title={
                isCollapsed
                  ? t("leftPanel.expandContent")
                  : t("leftPanel.collapseContent")
              }
            >
              {isCollapsed ? (
                <ChevronDown aria-hidden="true" />
              ) : (
                <ChevronUp aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className={styles.moduleContent}
          >
            {sortedModules.map((module, moduleIndex) => (
              <ModuleAccordion
                key={module.module_id}
                module={module}
                moduleIndex={moduleIndex}
                currentLessonId={currentLesson?.lesson_id}
                isExpanded={expandedModules.has(module.module_id)}
                expandedLessons={expandedLessons}
                lessonsActivities={lessonsActivities}
                lessonsMaterials={lessonsMaterials}
                lessonsQuizStatus={lessonsQuizStatus}
                onToggleModule={onToggleModule}
                onToggleLesson={onToggleLesson}
                onSelectActivity={onSelectActivity}
                onSelectMaterial={onSelectMaterial}
                onSelectLesson={onSelectLesson}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
