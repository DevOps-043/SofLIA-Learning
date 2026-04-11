"use client";

import { Edit2, Trash2 } from "lucide-react";
import type { LearnSavedNote } from "../types";
import { getNotePreviewText } from "./utils";

type NoteCardProps = {
  note: LearnSavedNote;
  onEdit: (note: LearnSavedNote) => void;
  onDelete: (noteId: string) => void;
  editLabel: string;
  deleteLabel: string;
};

export function NoteCard({
  note,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: NoteCardProps) {
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
          {note.title}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs text-[#6C757D] dark:text-white/60"
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
              className="p-1 hover:bg-[#0A2540]/10 dark:hover:bg-[#00D4B3]/20 rounded text-[#0A2540] dark:text-[#00D4B3] transition-colors"
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
        {getNotePreviewText(note)}
      </p>

      {note.lessonTitle ? (
        <div className="mb-2">
          <span className="inline-flex items-center rounded-full border border-[#E9ECEF] px-2 py-0.5 text-[11px] font-medium text-[#6C757D] dark:border-[#6C757D]/30 dark:text-white/60">
            {note.lessonTitle}
          </span>
        </div>
      ) : null}

      {note.tags && note.tags.length > 0 && (
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
