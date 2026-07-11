"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import { NoteContentView } from "@/features/notebook/components/NoteContentView";
import type { LearnNoteListItem } from "../types";

type GeneratedNoteViewerModalProps = {
  note: LearnNoteListItem | null;
  onClose: () => void;
  notebookHref?: string;
};

/**
 * Read-only viewer for AI-generated notes inside the course learn page, so the
 * user reviews the note without leaving the lesson. The full notebook editor
 * remains available through the secondary action.
 */
export function GeneratedNoteViewerModal({
  note,
  onClose,
  notebookHref,
}: GeneratedNoteViewerModalProps) {
  const { t } = useTranslation("learn");
  const router = useRouter();

  useEffect(() => {
    if (!note) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [note, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {note && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="generated-note-viewer-title"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4 dark:border-white/10 sm:p-5">
              <div className="min-w-0">
                <h3
                  id="generated-note-viewer-title"
                  className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg"
                >
                  {note.title}
                </h3>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:border-white/10 dark:text-gray-300">
                  <Sparkles className="h-3 w-3" />
                  {t(`leftPanel.notesSection.source.${note.source ?? "lesson_auto_note"}`)}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                aria-label={t("modals.close")}
                title={t("modals.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <NoteContentView
                html={note.fullContent || note.content}
                source={note.source}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 p-4 dark:border-white/10">
              {notebookHref && (
                <button
                  type="button"
                  onClick={() => router.push(notebookHref)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/10"
                >
                  <BookOpen className="h-4 w-4" />
                  {t("leftPanel.notesSection.openInNotebook")}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:brightness-95"
                style={{
                  backgroundColor: "var(--learn-action)",
                  color: "var(--learn-on-action)",
                }}
              >
                {t("modals.close")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
