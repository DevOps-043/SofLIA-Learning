"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { LearnNoteListItem, LearnNotesStats } from "./types";
import { GeneratedNoteViewerModal } from "./notes/GeneratedNoteViewerModal";
import { NoteCard } from "./notes/NoteCard";

type NotesSidebarSectionProps = {
  isCollapsed: boolean;
  savedNotes: LearnNoteListItem[];
  notesStats: LearnNotesStats;
  onToggleCollapsed: () => void;
  onCreateNote: () => void;
  onEditNote: (note: LearnNoteListItem) => void;
  onDeleteNote: (noteId: string) => void;
  notebookBasePath?: string;
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
}: NotesSidebarSectionProps) {
  const { t } = useTranslation("learn");
  // Los apuntes generados se leen en un visor modal sin abandonar el curso.
  const [viewingNote, setViewingNote] = useState<LearnNoteListItem | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-primary dark:text-white font-semibold text-sm"
          style={{ fontFamily: "var(--font-system-ui)", fontWeight: 600 }}
        >
          {t("leftPanel.notesSection.myNotes")}
        </h3>
        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <button
              onClick={onCreateNote}
              className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-primary/30 rounded-lg transition-colors"
              title={t("leftPanel.notesSection.newNote")}
            >
              <Plus className="w-4 h-4 text-gray-700 dark:text-white/70" />
            </button>
          )}
          <button
            onClick={onToggleCollapsed}
            className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-primary/30 rounded-lg transition-colors"
            title={
              isCollapsed
                ? t("leftPanel.notesSection.expandNotes")
                : t("leftPanel.notesSection.collapseNotes")
            }
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-700 dark:text-white/70" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-700 dark:text-white/70" />
            )}
          </button>
        </div>
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
            <div className="space-y-3 mb-6">
              <h3
                className="text-primary dark:text-white font-semibold text-sm"
                style={{ fontFamily: "var(--font-system-ui)", fontWeight: 600 }}
              >
                {t("leftPanel.notesSection.savedNotes")}
              </h3>

              <div className="space-y-2">
                {savedNotes.length === 0 ? (
                  <div className="bg-white dark:bg-carbon-800 rounded-xl p-4 border border-gray-200 dark:border-gray-500/30 text-center">
                    <p
                      className="text-sm text-primary dark:text-white"
                      style={{ fontFamily: "var(--font-system-ui)", fontWeight: 400 }}
                    >
                      {t("leftPanel.notesSection.noSavedNotes")}
                    </p>
                    <p
                      className="text-xs text-gray-500 dark:text-white/60 mt-1"
                      style={{ fontFamily: "var(--font-system-ui)", fontWeight: 400 }}
                    >
                      {t("leftPanel.notesSection.saveFirstNote")}
                    </p>
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
                      notebookHref={notebookBasePath ? `${notebookBasePath}/${note.id}` : undefined}
                    />
                  ))
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

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
