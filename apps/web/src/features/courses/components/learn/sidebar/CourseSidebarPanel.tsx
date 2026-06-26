"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSwipe } from "../../../../../hooks/useSwipe";
import { NotesSidebarSection } from "../NotesSidebarSection";
import type {
  LearnActivityMap,
  LearnLesson,
  LearnLessonQuizStatusMap,
  LearnMaterialMap,
  LearnModule,
  LearnNoteListItem,
  LearnNotesStats,
} from "../types";
import { CollapsedSidebarRail } from "./CollapsedSidebarRail";
import { CourseContentTree } from "./CourseContentTree";

type CourseSidebarPanelProps = {
  isOpen: boolean;
  isMobile: boolean;
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isMaterialCollapsed: boolean;
  isNotesCollapsed: boolean;
  expandedLessons: Set<string>;
  expandedModules: Set<string>;
  lessonsActivities: LearnActivityMap;
  lessonsMaterials: LearnMaterialMap;
  lessonsQuizStatus: LearnLessonQuizStatusMap;
  savedNotes: LearnNoteListItem[];
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
  onEditNote: (note: LearnNoteListItem) => void;
  onDeleteNote: (noteId: string) => void;
  onOpenSidebar: () => void;
  onOpenContentSection: () => void;
  onOpenNotesSection: () => void;
  onOpenNewNote: () => void;
  sidebarBg?: string;
  sidebarBorderColor?: string;
  accentColor?: string;
};

export function CourseSidebarPanel({
  isOpen,
  isMobile,
  modules,
  currentLesson,
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
  sidebarBg,
  sidebarBorderColor,
  accentColor,
}: CourseSidebarPanelProps) {
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
              data-tour-id="course-learn--sidebar"
              ref={swipeToCloseRef}
              initial={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
              animate={isMobile ? { x: 0 } : { width: 320, opacity: 1 }}
              exit={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`${
                isMobile
                  ? "fixed inset-y-0 left-0 z-50 w-full max-w-sm md:relative md:inset-auto md:w-auto md:max-w-none"
                  : "relative h-full md:my-2 md:ml-2 md:rounded-lg"
              } flex flex-col overflow-hidden border-r border-gray-200 bg-white dark:border-white/5 dark:bg-carbon-900`}
              style={{
                ...(sidebarBg ? { backgroundColor: sidebarBg } : {}),
                ...(sidebarBorderColor ? { borderColor: sidebarBorderColor } : {}),
              }}
            >
              <div
                className="flex-1 overflow-y-auto px-6 pb-24 md:pb-6"
                style={{
                  paddingTop: isMobile
                    ? `calc(4.5rem + env(safe-area-inset-top, 0px))`
                    : "1.5rem",
                }}
              >
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

                <div className="mb-6 border-b border-gray-200 dark:border-gray-500/30" />

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
