"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  NotebookPen,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { LearnNoteListItem, LearnNotesStats } from "./types";
import { GeneratedNoteViewerModal } from "./notes/GeneratedNoteViewerModal";
import { NoteCard } from "./notes/NoteCard";
import styles from "./sidebar/CourseSidebar.module.css";

type NotesSidebarSectionProps = {
  isCollapsed: boolean;
  savedNotes: LearnNoteListItem[];
  notesStats: LearnNotesStats;
  onToggleCollapsed: () => void;
  onCreateNote: () => void;
  onEditNote: (note: LearnNoteListItem) => void;
  onDeleteNote: (noteId: string) => void;
  notebookBasePath?: string;
  showHeader?: boolean;
};

export function NotesSidebarSection({
  isCollapsed,
  savedNotes,
  notesStats,
  onToggleCollapsed,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  notebookBasePath,
  showHeader = true,
}: NotesSidebarSectionProps) {
  const { t } = useTranslation("learn");
  // Los apuntes generados se leen en un visor modal sin abandonar el curso.
  const [viewingNote, setViewingNote] = useState<LearnNoteListItem | null>(null);

  return (
    <>
      <section className={styles.notesSection}>
        {showHeader ? (
          <div className={styles.notesHeader}>
            <h3 className={styles.notesTitle}>
              <NotebookPen aria-hidden="true" />
              {t("leftPanel.notesSection.myNotes")}
            </h3>
            <div className={styles.notesActions}>
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={onCreateNote}
                  className={styles.notesAction}
                  title={t("leftPanel.notesSection.newNote")}
                >
                  <Plus aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={onToggleCollapsed}
                className={styles.notesAction}
                title={
                  isCollapsed
                    ? t("leftPanel.notesSection.expandNotes")
                    : t("leftPanel.notesSection.collapseNotes")
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
              <div className={styles.notesSummary}>
                <p>{t("leftPanel.notesSection.savedNotes")}</p>
                <span>{notesStats.totalNotes}</span>
              </div>

              <div className={styles.notesList}>
                {savedNotes.length === 0 ? (
                  <div className={styles.emptyNotes}>
                    <div>
                      <span className={styles.emptyNotesIcon}>
                        <FileText aria-hidden="true" />
                      </span>
                      <strong>
                        {t("leftPanel.notesSection.noSavedNotes")}
                      </strong>
                      <p>{t("leftPanel.notesSection.saveFirstNote")}</p>
                    </div>
                  </div>
                ) : (
                  savedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={onEditNote}
                      onDelete={onDeleteNote}
                      onView={setViewingNote}
                      editLabel={t("leftPanel.notesSection.editNote")}
                      deleteLabel={t("leftPanel.notesSection.deleteNote")}
                      notebookHref={
                        notebookBasePath
                          ? `${notebookBasePath}/${note.id}`
                          : undefined
                      }
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <GeneratedNoteViewerModal
        note={viewingNote}
        onClose={() => setViewingNote(null)}
        notebookHref={
          viewingNote && notebookBasePath
            ? `${notebookBasePath}/${viewingNote.id}`
            : undefined
        }
      />
    </>
  );
}
