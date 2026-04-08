"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  LearnActivityMap,
  LearnLesson,
  LearnLessonQuizStatusMap,
  LearnMaterialMap,
  LearnModule,
} from "../types";
import { ModuleAccordion } from "./ModuleAccordion";
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
  onSelectLesson: (lesson: LearnLesson) => void | Promise<void>;
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
  onSelectLesson,
}: CourseContentTreeProps) {
  const { t } = useTranslation("learn");
  const sortedModules = sortModules(modules);

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <Layers className="h-3 w-3 text-[#0A2540] dark:text-[#00D4B3]" />
          {t("leftPanel.content")}
        </h3>

        <button
          onClick={onToggleCollapsed}
          className="rounded-lg p-1.5 transition-colors hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/30"
          title={
            isCollapsed ? t("leftPanel.expandContent") : t("leftPanel.collapseContent")
          }
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-[#6C757D] dark:text-white/70" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[#6C757D] dark:text-white/70" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
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
                onSelectLesson={onSelectLesson}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
