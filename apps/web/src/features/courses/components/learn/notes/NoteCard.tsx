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
      className="bg-white dark:bg-[#1E2329] rounded-xl p-3 border border-[#E9ECEF] dark:border-[#6C757D]/30 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/50 transition-colors group cursor-pointer"
      onClick={() => onEdit(note)}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm text-[#0A2540] dark:text-white font-medium"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
        >
          <span className="inline-flex items-center gap-1.5">
            {(isGeneratedSummary || isSummaryCandidate) && (
              <BookMarked className="h-3.5 w-3.5 text-[#00D4B3]" />
            )}
            {note.title}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs text-[#6C757D] dark:text-white/60"
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          >
            {note.timestamp}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isSummaryCandidate && !isGeneratedSummary && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(note);
                }}
                className="p-1 hover:bg-[#0A2540]/10 dark:hover:bg-[#00D4B3]/20 rounded text-[#0A2540] dark:text-[#00D4B3] transition-colors"
                title={editLabel}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            {isSummaryCandidate ? (
              onGenerateDefaultSummary ? (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onGenerateDefaultSummary(note.moduleId);
                  }}
                  disabled={isRegenerating}
                  className="p-1 hover:bg-[#00D4B3]/20 rounded text-[#00D4B3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={generateLabel}
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`}
                  />
                </button>
              ) : null
            ) : isGeneratedSummary ? (
              note.canRegenerate && onRegenerateSummary ? (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onRegenerateSummary(note.moduleId);
                  }}
                  disabled={isRegenerating}
                  className="p-1 hover:bg-[#00D4B3]/20 rounded text-[#00D4B3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={regenerateLabel}
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`}
                  />
                </button>
              ) : null
            ) : (
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
            )}
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
            <span className="inline-flex items-center rounded-full border border-[#00D4B3]/30 px-2 py-0.5 text-[11px] font-medium text-[#0A2540] dark:text-[#00D4B3]">
              {versionLabel}
            </span>
          ) : null}
          {(isGeneratedSummary || isSummaryCandidate) && note.moduleTitle ? (
            <span className="inline-flex items-center rounded-full border border-[#E9ECEF] px-2 py-0.5 text-[11px] font-medium text-[#6C757D] dark:border-[#6C757D]/30 dark:text-white/60">
              {note.moduleTitle}
            </span>
          ) : null}
        </div>
      ) : note.lessonTitle ? (
        <div className="mb-2">
          <span className="inline-flex items-center rounded-full border border-[#E9ECEF] px-2 py-0.5 text-[11px] font-medium text-[#6C757D] dark:border-[#6C757D]/30 dark:text-white/60">
            {note.lessonTitle}
          </span>
        </div>
      ) : null}

      {isSummaryCandidate && onGenerateDefaultSummary ? (
        <button
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#00D4B3]/30 px-3 py-2 text-xs font-semibold text-[#0A2540] transition-colors hover:bg-[#00D4B3]/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#00D4B3]"
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
              className="inline-block px-2 py-0.5 bg-[#0A2540]/10 dark:bg-[#00D4B3]/20 text-[#0A2540] dark:text-[#00D4B3] text-xs rounded border border-[#0A2540]/20 dark:border-[#00D4B3]/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
