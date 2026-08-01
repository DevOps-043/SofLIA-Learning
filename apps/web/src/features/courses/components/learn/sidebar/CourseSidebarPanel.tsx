"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Layers3,
  NotebookPen,
  PanelLeftClose,
  Plus,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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
import styles from "./CourseSidebar.module.css";

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
  notebookBasePath?: string;
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
  notebookBasePath,
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
  const { t } = useTranslation("learn");
  const [activeSection, setActiveSection] = useState<"content" | "notes">(
    !isNotesCollapsed && isMaterialCollapsed ? "notes" : "content"
  );

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

  useEffect(() => {
    if (!isNotesCollapsed && isMaterialCollapsed) {
      setActiveSection("notes");
    } else if (!isMaterialCollapsed && isNotesCollapsed) {
      setActiveSection("content");
    }
  }, [isMaterialCollapsed, isNotesCollapsed]);

  const selectSection = (section: "content" | "notes") => {
    setActiveSection(section);

    if (section === "content") {
      if (isMaterialCollapsed) onToggleMaterialCollapsed();
      if (!isNotesCollapsed) onToggleNotesCollapsed();
      return;
    }

    if (!isMaterialCollapsed) onToggleMaterialCollapsed();
    if (isNotesCollapsed) onToggleNotesCollapsed();
  };

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
              animate={isMobile ? { x: 0 } : { width: 368, opacity: 1 }}
              exit={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`${styles.sidebarWindow} ${
                isMobile ? styles.sidebarMobile : ""
              }`}
              style={{
                ...(sidebarBg ? { backgroundColor: sidebarBg } : {}),
                ...(sidebarBorderColor ? { borderColor: sidebarBorderColor } : {}),
              }}
            >
              <div className={styles.panelHeader}>
                <div className={styles.sectionTabs} role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeSection === "content"}
                    onClick={() => selectSection("content")}
                    className={`${styles.sectionTab} ${
                      activeSection === "content"
                        ? styles.sectionTabActive
                        : ""
                    }`}
                  >
                    <Layers3 aria-hidden="true" />
                    <span>{t("leftPanel.content")}</span>
                    <span className={styles.tabCount}>{modules.length}</span>
                  </button>
                  <button
                    type="button"
                    data-tour-id="course-learn--notes-tab"
                    role="tab"
                    aria-selected={activeSection === "notes"}
                    onClick={() => selectSection("notes")}
                    className={`${styles.sectionTab} ${
                      activeSection === "notes"
                        ? styles.sectionTabActive
                        : ""
                    }`}
                  >
                    <NotebookPen aria-hidden="true" />
                    <span>{t("leftPanel.notesSection.myNotes")}</span>
                    <span className={styles.tabCount}>{savedNotes.length}</span>
                  </button>
                </div>

                {activeSection === "notes" ? (
                  <button
                    type="button"
                    onClick={onCreateNote}
                    className={styles.headerAction}
                    aria-label={t("leftPanel.notesSection.newNote")}
                    title={t("leftPanel.notesSection.newNote")}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  className={styles.panelClose}
                  aria-label={t("leftPanel.closePanel")}
                  title={t("leftPanel.closePanel")}
                >
                  {isMobile ? (
                    <X aria-hidden="true" />
                  ) : (
                    <PanelLeftClose aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className={styles.panelBody}>
                <AnimatePresence mode="wait" initial={false}>
                  {activeSection === "content" ? (
                    <motion.div
                      key="content"
                      role="tabpanel"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 6 }}
                      transition={{ duration: 0.18 }}
                      className={styles.sectionViewport}
                    >
                      <CourseContentTree
                        modules={modules}
                        currentLesson={currentLesson}
                        isCollapsed={false}
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
                        showHeader={false}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="notes"
                      role="tabpanel"
                      initial={{ opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.18 }}
                      className={styles.sectionViewport}
                    >
                  <NotesSidebarSection
                    isCollapsed={false}
                    savedNotes={savedNotes}
                    notesStats={notesStats}
                    onToggleCollapsed={onToggleNotesCollapsed}
                    onCreateNote={onCreateNote}
                    onEditNote={onEditNote}
                    onDeleteNote={onDeleteNote}
                    notebookBasePath={notebookBasePath}
                    showHeader={false}
                  />
                    </motion.div>
                  )}
                </AnimatePresence>
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
