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
  onSelectLesson,
}: ModuleAccordionProps) {
  const { t } = useTranslation("learn");
  const sortedLessons = sortLessons(module.lessons || []);
  const { completedLessons, totalLessons, completionPercentage } =
    getModuleProgress(sortedLessons);

  return (
    <div className="mb-6">
      <div className="group-hover:bg-white/[0.02] flex items-start justify-between rounded-lg p-2 transition-colors">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-[#00D4B3]">
              Módulo {moduleIndex + 1}
            </span>
            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-white/10" />
          </div>

          <h3
            className="pr-4 text-sm font-semibold leading-tight text-gray-900 dark:text-white/90"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {module.module_title}
          </h3>
        </div>

        <button
          onClick={() => onToggleModule(module.module_id)}
          className="flex-shrink-0 rounded-md p-2 transition-colors hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
          title={
            isExpanded ? t("leftPanel.collapseModule") : t("leftPanel.expandModule")
          }
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#6C757D] dark:text-white/60" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mb-4 flex gap-3">
              <span
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-[#00D4B3]/30 dark:bg-[#00D4B3]/20 dark:text-[#00D4B3]"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
              >
                {completedLessons}/{totalLessons} {t("leftPanel.completed")}
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-[#00D4B3]/30 dark:bg-[#00D4B3]/20 dark:text-[#00D4B3]">
                {completionPercentage}% {t("leftPanel.completedPercentage")}
              </span>
            </div>

            <div className="space-y-2">
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
                      onSelectLesson={onSelectLesson}
                      onToggleExpanded={onToggleLesson}
                      expandLabel={t("activities.expandCollapse")}
                      collapseLabel={t("activities.collapse")}
                    />
                  );
                })
              ) : (
                <div className="py-4 text-center text-sm text-gray-500 dark:text-slate-400">
                  Este módulo aún no tiene lecciones
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
