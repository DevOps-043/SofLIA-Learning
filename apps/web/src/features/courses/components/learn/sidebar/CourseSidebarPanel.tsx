"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { COURSE_LEARN_TOUR_TARGET_IDS } from "../../../../../core/constants/tourTargets";
import { useSwipe } from "../../../../../hooks/useSwipe";
import { NotesSidebarSection } from "../NotesSidebarSection";
import type {
  LearnActivityMap,
  LearnLesson,
  LearnLessonQuizStatusMap,
  LearnMaterialMap,
  LearnModule,
  LearnNotesStats,
  LearnPathState,
  LearnSavedNote,
} from "../types";
import { CollapsedSidebarRail } from "./CollapsedSidebarRail";
import { CourseContentTree } from "./CourseContentTree";

type CourseSidebarPanelProps = {
  isOpen: boolean;
  isMobile: boolean;
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  learningPathState: LearnPathState | null;
  isMaterialCollapsed: boolean;
  isNotesCollapsed: boolean;
  expandedLessons: Set<string>;
  expandedModules: Set<string>;
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  lessonsQuizStatus: LearnLessonQuizStatusMap;
  savedNotes: LearnSavedNote[];
  notesStats: LearnNotesStats;
  onClose: () => void;
  onToggleMaterialCollapsed: () => void;
  onToggleNotesCollapsed: () => void;
  onToggleLessonExpand: (lessonId: string) => void | Promise<void>;
  onToggleModuleExpand: (moduleId: string) => void;
  onSelectActivity: (target: {
    activityId: string;
    lesson: LearnLesson;
  }) => void | Promise<void>;
  onSelectMaterial: (target: {
    materialId: string;
    lesson: LearnLesson;
  }) => void | Promise<void>;
  onSelectLesson: (lesson: LearnLesson) => void | Promise<void>;
  onCreateNote: () => void;
  onEditNote: (note: LearnSavedNote) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenSidebar: () => void;
  onOpenContentSection: () => void;
  onOpenNotesSection: () => void;
  onOpenNewNote: () => void;
};

export function CourseSidebarPanel({
  isOpen,
  isMobile,
  modules,
  currentLesson,
  learningPathState,
  isMaterialCollapsed,
  isNotesCollapsed,
  expandedLessons,
  expandedModules,
  lessonsActivities,
  lessonsMaterials,
  lessonsQuizStatus,
  savedNotes,
  notesStats,
  onClose,
  onToggleMaterialCollapsed,
  onToggleNotesCollapsed,
  onToggleLessonExpand,
  onToggleModuleExpand,
  onSelectActivity,
  onSelectMaterial,
  onSelectLesson,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onOpenSidebar,
  onOpenContentSection,
  onOpenNotesSection,
  onOpenNewNote,
}: CourseSidebarPanelProps) {
  const { t } = useTranslation("learn");

  const swipeToCloseRef = useSwipe<HTMLDivElement>({
    onSwipeLeft: () => {
      if (isMobile && isOpen) {
        onClose();
      }
    },
    threshold: 60,
    velocity: 0.3,
    enabled: isMobile && isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              />
            )}

            <motion.div
              ref={swipeToCloseRef}
              id={COURSE_LEARN_TOUR_TARGET_IDS.sidebar}
              initial={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 320, opacity: 1 }}
              exit={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${
                isMobile
                  ? "fixed inset-y-0 left-0 z-50 w-full max-w-sm md:relative md:inset-auto md:w-auto md:max-w-none"
                  : "relative h-full"
              } flex flex-col overflow-hidden border-r border-gray-200 bg-white dark:border-white/5 dark:bg-[#0F1419]`}
            >
              <div
                className="flex-1 overflow-y-auto px-6 pb-24 md:pb-6"
                style={{
                  paddingTop: isMobile
                    ? `calc(4.5rem + env(safe-area-inset-top, 0px))`
                    : "1.5rem",
                }}
              >
                {learningPathState ? (
                  <div className="mb-6 rounded-2xl border border-[#00D4B3]/20 bg-[#00D4B3]/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#00D4B3]">
                      {t("leftPanel.learningPath.badge")}
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      {learningPathState.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
                      {t("leftPanel.learningPath.completedCount", {
                        completed: learningPathState.completedItemsCount,
                        total: learningPathState.totalItemsCount,
                      })}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#00D4B3]"
                        style={{ width: `${learningPathState.progressPercentage}%` }}
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      {learningPathState.items.map((item) => (
                        <div
                          key={`${item.courseId}-${item.position}`}
                          className={`rounded-xl border px-3 py-2 text-xs ${
                            item.isCurrent
                              ? "border-[#00D4B3]/40 bg-[#00D4B3]/10"
                              : item.isUnlocked
                                ? "border-black/10 bg-white/40 dark:border-white/10 dark:bg-white/5"
                                : "border-amber-500/20 bg-amber-500/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-gray-900 dark:text-white/90">
                              {item.position}. {item.title}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500 dark:text-white/50">
                              {item.isCompleted
                                ? t("leftPanel.learningPath.status.completed")
                                : item.isUnlocked
                                  ? t("leftPanel.learningPath.status.available")
                                  : t("leftPanel.learningPath.status.locked")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <CourseContentTree
                  modules={modules}
                  currentLesson={currentLesson}
                  isCollapsed={isMaterialCollapsed}
                  expandedLessons={expandedLessons}
                  expandedModules={expandedModules}
                  lessonsActivities={lessonsActivities}
                  lessonsMaterials={lessonsMaterials}
                  lessonsQuizStatus={lessonsQuizStatus}
                  onToggleCollapsed={onToggleMaterialCollapsed}
                  onToggleModule={onToggleModuleExpand}
                  onToggleLesson={onToggleLessonExpand}
                  onSelectActivity={onSelectActivity}
                  onSelectMaterial={onSelectMaterial}
                  onSelectLesson={onSelectLesson}
                  onClosePanel={onClose}
                />

                <div className="mb-6 border-b border-[#E9ECEF] dark:border-[#6C757D]/30" />

                <div className="space-y-4">
                  <NotesSidebarSection
                    isCollapsed={isNotesCollapsed}
                    savedNotes={savedNotes}
                    notesStats={notesStats}
                    onToggleCollapsed={onToggleNotesCollapsed}
                    onCreateNote={onCreateNote}
                    onEditNote={onEditNote}
                    onDeleteNote={onDeleteNote}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isOpen && (
        <CollapsedSidebarRail
          onOpenSidebar={onOpenSidebar}
          onOpenContent={onOpenContentSection}
          onOpenNotes={onOpenNotesSection}
          onOpenNewNote={onOpenNewNote}
        />
      )}
    </>
  );
}
