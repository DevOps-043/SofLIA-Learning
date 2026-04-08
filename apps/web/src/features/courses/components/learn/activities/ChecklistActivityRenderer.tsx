"use client";

import type { ActivityChecklistItem } from "@/features/courses/types/activity-config";

export function ChecklistActivityRenderer({
  content,
  evidencePlaceholder,
  evidenceValue,
  items,
  noteValue,
  onEvidenceChange,
  onNoteChange,
  onToggleItem,
  values,
}: {
  content?: string;
  evidencePlaceholder?: string;
  evidenceValue: string;
  items: ActivityChecklistItem[];
  noteValue: string;
  onEvidenceChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onToggleItem: (itemId: string) => void;
  values: Record<string, boolean>;
}) {
  return (
    <div className="space-y-4">
      {content && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-[#10161D]">
          <div className="space-y-2">
            {content
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line.length > 0 && !/^\[([\sxX])\]\s*/.test(line))
              .map((line, index) => (
                <p
                  key={`content-${index}`}
                  className="text-sm leading-relaxed text-gray-700 dark:text-white/80"
                >
                  {line}
                </p>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const checked = values[item.id] === true;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleItem(item.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-[#0A2540]/25 hover:bg-gray-50 dark:border-white/10 dark:bg-[#10161D] dark:hover:border-[#00D4B3]/30 dark:hover:bg-white/[0.03]"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-[11px] font-bold transition ${
                  checked
                    ? "border-[#0A2540] bg-[#0A2540] text-white dark:border-[#00D4B3] dark:bg-[#00D4B3] dark:text-[#08141F]"
                    : "border-gray-300 text-transparent dark:border-white/20"
                }`}
              >
                ✓
              </span>
              <span className="flex-1">
                <span
                  className={`block text-sm leading-relaxed ${
                    checked
                      ? "text-gray-600 line-through dark:text-white/60"
                      : "text-gray-800 dark:text-white"
                  }`}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="mt-1 block text-xs text-gray-500 dark:text-white/45">
                    {item.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
          Nota opcional
        </label>
        <textarea
          value={noteValue}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-[#0A2540]/30 focus:ring-2 focus:ring-[#0A2540]/10 dark:border-white/10 dark:bg-[#10161D] dark:text-white dark:focus:border-[#00D4B3]/40 dark:focus:ring-[#00D4B3]/20"
          placeholder="Opcional: explica que hiciste, bloqueos o hallazgos."
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
          Evidencia opcional
        </label>
        <textarea
          value={evidenceValue}
          onChange={(event) => onEvidenceChange(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800 outline-none transition focus:border-[#0A2540]/30 focus:ring-2 focus:ring-[#0A2540]/10 dark:border-white/10 dark:bg-[#10161D] dark:text-white dark:focus:border-[#00D4B3]/40 dark:focus:ring-[#00D4B3]/20"
          placeholder={
            evidencePlaceholder ||
            "Pega aqui enlaces, notas o evidencia complementaria."
          }
        />
      </div>
    </div>
  );
}
