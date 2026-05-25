"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { LearnNoteListItem, LearnNotesStats } from "./types";
import { NoteCard } from "./notes/NoteCard";

type NotesSidebarSectionProps = {
  isCollapsed: boolean;
  savedNotes: LearnNoteListItem[];
  notesStats: LearnNotesStats;
  onToggleCollapsed: () => void;
  onCreateNote: () => void;
  onEditNote: (note: LearnNoteListItem) => void;
  onDeleteNote: (noteId: string) => void;
  onRegenerateSummary: (moduleId: string) => void;
  onGenerateDefaultSummary: (moduleId: string) => void;
  regeneratingSummaryModuleId: string | null;
};

export function NotesSidebarSection({
  isCollapsed,
  savedNotes,
  notesStats,
  onToggleCollapsed,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onRegenerateSummary,
  onGenerateDefaultSummary,
  regeneratingSummaryModuleId,
}: NotesSidebarSectionProps) {
  const { t } = useTranslation("learn");

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-primary dark:text-white font-semibold text-sm"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
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
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
              >
                {t("leftPanel.notesSection.savedNotes")}
              </h3>

              <div className="space-y-2">
                {savedNotes.length === 0 ? (
                  <div className="bg-white dark:bg-carbon-800 rounded-xl p-4 border border-gray-200 dark:border-gray-500/30 text-center">
                    <p
                      className="text-sm text-primary dark:text-white"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                    >
                      {t("leftPanel.notesSection.noSavedNotes")}
                    </p>
                    <p
                      className="text-xs text-gray-500 dark:text-white/60 mt-1"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
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
                      onRegenerateSummary={onRegenerateSummary}
                      onGenerateDefaultSummary={onGenerateDefaultSummary}
                      isRegenerating={
                        (note.kind === "module_learning_summary" ||
                          note.kind === "module_learning_summary_candidate") &&
                        regeneratingSummaryModuleId === note.moduleId
                      }
                      editLabel={t("leftPanel.notesSection.editNote")}
                      deleteLabel={t("leftPanel.notesSection.deleteNote")}
                      generateLabel={t("leftPanel.notesSection.generateSummary")}
                      regenerateLabel={t("leftPanel.notesSection.regenerateSummary")}
                      failedLabel={t("leftPanel.notesSection.summaryFailed")}
                      versionLabel={
                        note.kind === "module_learning_summary"
                          ? t("leftPanel.notesSection.generatedSummaryBadge")
                          : undefined
                      }
                      lockedLabel={
                        note.kind === "module_learning_summary_candidate"
                          ? t("leftPanel.notesSection.summaryMissing")
                          : t("leftPanel.notesSection.summaryGenerating")
                      }
                    />
                  ))
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
