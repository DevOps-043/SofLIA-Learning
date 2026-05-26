"use client";

import { BookMarked, Edit2, RefreshCw, Trash2 } from "lucide-react";
import type { LearnNoteListItem } from "../types";
import { getNotePreviewText } from "./utils";

type NoteCardProps = {
  note: LearnNoteListItem;
  onEdit: (note: LearnNoteListItem) => void;
  onDelete: (noteId: string) => void;
  onRegenerateSummary?: (moduleId: string) => void;
  onGenerateDefaultSummary?: (moduleId: string) => void;
  isRegenerating?: boolean;
  editLabel: string;
  deleteLabel: string;
  generateLabel?: string;
  regenerateLabel?: string;
  failedLabel?: string;
  versionLabel?: string;
  lockedLabel?: string;
};

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onRegenerateSummary,
  onGenerateDefaultSummary,
  isRegenerating,
  editLabel,
  deleteLabel,
  generateLabel,
  regenerateLabel,
  failedLabel,
  versionLabel,
  lockedLabel,
}: NoteCardProps) {
  const isGeneratedSummary = note.kind === "module_learning_summary";
  const isSummaryCandidate = note.kind === "module_learning_summary_candidate";

  return (
    <div
      className="bg-white dark:bg-carbon-800 rounded-xl p-3 border border-gray-200 dark:border-gray-500/30 hover:bg-gray-200/50 dark:hover:bg-primary/50 transition-colors group cursor-pointer"
      onClick={() => onEdit(note)}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm text-primary dark:text-white font-medium"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
        >
          <span className="inline-flex items-center gap-1.5">
            {(isGeneratedSummary || isSummaryCandidate) && (
              <BookMarked className="h-3.5 w-3.5 text-accent" />
            )}
            {note.title}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs text-gray-500 dark:text-white/60"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {note.timestamp}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onEdit(note);
              }}
              className="p-1 hover:bg-primary/10 dark:hover:bg-accent/20 rounded text-primary dark:text-accent transition-colors"
              title={editLabel}
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
              title={deleteLabel}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-white/70 line-clamp-2 mb-2 whitespace-pre-line">
        {isSummaryCandidate
          ? lockedLabel
          : isGeneratedSummary && note.status !== "ready"
          ? note.status === "generating"
            ? lockedLabel
            : failedLabel || getNotePreviewText(note)
          : getNotePreviewText(note)}
      </p>

      {isGeneratedSummary || isSummaryCandidate ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {isGeneratedSummary && versionLabel ? (
            <span className="inline-flex items-center rounded-full border border-accent/30 px-2 py-0.5 text-[11px] font-medium text-primary dark:text-accent">
              {versionLabel}
            </span>
          ) : null}
          {(isGeneratedSummary || isSummaryCandidate) && note.moduleTitle ? (
            <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:border-gray-500/30 dark:text-white/60">
              {note.moduleTitle}
            </span>
          ) : null}
        </div>
      ) : note.lessonTitle ? (
        <div className="mb-2">
          <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:border-gray-500/30 dark:text-white/60">
            {note.lessonTitle}
          </span>
        </div>
      ) : null}

      {isSummaryCandidate && onGenerateDefaultSummary ? (
        <button
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-accent"
          disabled={isRegenerating}
          onClick={(event) => {
            event.stopPropagation();
            onGenerateDefaultSummary(note.moduleId);
          }}
          type="button"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`}
          />
          {generateLabel}
        </button>
      ) : null}

      {note.kind !== "module_learning_summary" &&
        note.kind !== "module_learning_summary_candidate" &&
        note.tags &&
        note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 bg-primary/10 dark:bg-accent/20 text-primary dark:text-accent text-xs rounded border border-primary/20 dark:border-accent/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
