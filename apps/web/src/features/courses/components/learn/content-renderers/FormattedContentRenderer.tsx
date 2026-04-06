"use client";

import { useState } from "react";
import { normalizeContentForRenderer } from "@/lib/course-content";

type FormattedContentItem = {
  type:
    | "main-title"
    | "section-title"
    | "subsection-title"
    | "paragraph"
    | "list"
    | "example"
    | "highlight"
    | "checklist";
  content: string;
  level?: number;
  checked?: boolean;
  originalLine?: string;
};

// ─── ChecklistItem (internal) ────────────────────────────────────────────────

function ChecklistItem({
  content,
  checked: initialChecked,
  activityId,
  lineIndex,
}: {
  content: string;
  checked: boolean;
  activityId?: string;
  lineIndex: number;
}) {
  const storageKey = activityId
    ? `checklist-${activityId}-${lineIndex}`
    : `checklist-global-${lineIndex}`;

  const [checked, setChecked] = useState(() => {
    if (typeof window !== "undefined" && activityId) {
      const saved = localStorage.getItem(storageKey);
      return saved !== null ? saved === "true" : initialChecked;
    }
    return initialChecked;
  });

  const handleToggle = () => {
    const nextChecked = !checked;
    setChecked(nextChecked);
    if (typeof window !== "undefined" && activityId) {
      localStorage.setItem(storageKey, String(nextChecked));
    }
  };

  return (
    <div className="flex items-start gap-3 my-3 pl-2">
      <button
        onClick={handleToggle}
        className={`
          mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
          ${
            checked
              ? "bg-[#00D4B3] border-[#00D4B3] dark:bg-[#00D4B3] dark:border-[#00D4B3]"
              : "bg-white dark:bg-[#1E2329] border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3] dark:hover:border-[#00D4B3]"
          }
          focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 focus:ring-offset-1
        `}
        aria-checked={checked}
        role="checkbox"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleToggle();
          }
        }}
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <p
        className={`flex-1 text-base leading-relaxed cursor-pointer ${
          checked ? "text-gray-600 dark:text-slate-400 line-through" : "text-gray-800 dark:text-slate-200"
        }`}
        onClick={handleToggle}
      >
        {content}
      </p>
    </div>
  );
}

// ─── FormattedContentRenderer ────────────────────────────────────────────────

export function FormattedContentRenderer({
  content,
  activityId,
}: {
  content: unknown;
  activityId?: string;
}) {
  const readingContent = normalizeContentForRenderer(content);

  if (!readingContent.trim()) {
    return null;
  }

  if (/<[a-z][\s\S]*>/i.test(readingContent)) {
    return (
      <div className="bg-white dark:bg-[#1E2329] rounded-lg p-8 md:p-10 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg">
        <article
          className="prose prose-slate dark:prose-invert max-w-none text-[#0A2540] dark:text-white leading-relaxed overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-sm [&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-white/20 [&_th]:bg-gray-100 dark:[&_th]:bg-white/10 [&_th]:p-3 [&_th]:font-semibold [&_th]:text-left [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-white/10 [&_td]:p-3"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          dangerouslySetInnerHTML={{ __html: readingContent }}
        />
      </div>
    );
  }

  const lines = readingContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const formattedContent: FormattedContentItem[] = [];

  lines.forEach((line, index) => {
    const checklistPattern = /^\[([\sxX])\]\s*(.+)$/;
    const checklistMatch = line.match(checklistPattern);
    if (checklistMatch) {
      formattedContent.push({
        type: "checklist",
        content: checklistMatch[2].trim(),
        checked: checklistMatch[1].toLowerCase() === "x",
        originalLine: line,
      });
      return;
    }

    const mainSections =
      /^(Introducci[o\u00f3]n|Cuerpo|Cierre|Conclusi[o\u00f3]n|Resumen|Introducci[o\u00f3]n:|Cuerpo:|Cierre:|Conclusi[o\u00f3]n:|Resumen:)$/i;
    if (mainSections.test(line)) {
      formattedContent.push({ type: "main-title", content: line.replace(/[:]$/, ""), level: 1 });
      return;
    }

    const numberedSubsection =
      /^(\d+)[\.\)]\s+([A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1][^.!?]*)$/;
    const numberedMatch = line.match(numberedSubsection);
    if (numberedMatch && line.length < 100) {
      formattedContent.push({ type: "subsection-title", content: line, level: 2 });
      return;
    }

    if (
      line.length > 0 &&
      line.length < 80 &&
      line.match(/^[A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1][^.!?]*$/) &&
      !line.match(/^\d+[\.\)]/) &&
      !line.includes(":") &&
      index < lines.length - 1 &&
      lines[index + 1] &&
      lines[index + 1].length > 50
    ) {
      formattedContent.push({ type: "section-title", content: line, level: 1 });
      return;
    }

    if (line.match(/^Ejemplos?[:]?/i) || line.match(/Por ejemplo/i)) {
      formattedContent.push({ type: "example", content: line });
      return;
    }

    if (line.match(/^["']|["']$/) && line.length < 100) {
      formattedContent.push({ type: "highlight", content: line });
      return;
    }

    if (line.match(/^[-•]\s/) || line.match(/^\d+[\.\)]\s+[-•]/)) {
      formattedContent.push({ type: "list", content: line });
      return;
    }

    formattedContent.push({ type: "paragraph", content: line });
  });

  return (
    <div className="bg-white dark:bg-[#1E2329] rounded-lg p-8 md:p-10 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg">
      <article className="prose dark:prose-invert max-w-none">
        <div
          className="text-[#0A2540] dark:text-white leading-relaxed space-y-6"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
        >
          {formattedContent.map((item, index) => {
            if (item.type === "main-title") {
              return (
                <div key={`item-${index}`} className="mt-10 mb-6 first:mt-0">
                  <h1
                    className="text-[#0A2540] dark:text-white font-bold text-3xl mb-2 border-b-2 border-[#00D4B3]/40 pb-3"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                  >
                    {item.content}
                  </h1>
                </div>
              );
            }

            if (item.type === "section-title") {
              return (
                <h2
                  key={`item-${index}`}
                  className="text-[#0A2540] dark:text-white font-bold text-2xl mb-4 mt-8 border-b border-[#00D4B3]/20 pb-2"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
                >
                  {item.content}
                </h2>
              );
            }

            if (item.type === "subsection-title") {
              const subsectionMatch = item.content.match(/^(\d+)[\.\)]\s+(.+)$/);
              if (subsectionMatch) {
                return (
                  <div key={`item-${index}`} className="mt-8 mb-4">
                    <h3
                      className="text-[#00D4B3] font-semibold text-xl mb-3 flex items-center gap-3"
                      style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                    >
                      <span className="w-10 h-10 rounded-full bg-[#00D4B3]/20 border-2 border-[#00D4B3]/40 flex items-center justify-center text-[#00D4B3] font-bold text-lg">
                        {subsectionMatch[1]}
                      </span>
                      <span>{subsectionMatch[2]}</span>
                    </h3>
                  </div>
                );
              }
              return (
                <h3
                  key={`item-${index}`}
                  className="text-[#00D4B3] font-semibold text-xl mb-3 mt-6"
                  style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                >
                  {item.content}
                </h3>
              );
            }

            if (item.type === "example") {
              return (
                <div
                  key={`item-${index}`}
                  className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border-l-4 border-[#00D4B3]/50 rounded-r-lg p-4 my-4"
                >
                  <p
                    className="text-[#00D4B3] dark:text-[#00D4B3] font-semibold mb-2 text-sm uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
                  >
                    {item.content.match(/^Ejemplos?[:]?/i) ? item.content : "Ejemplo"}
                  </p>
                </div>
              );
            }

            if (item.type === "highlight") {
              return (
                <div
                  key={`item-${index}`}
                  className="bg-yellow-500/10 border-l-4 border-yellow-500/50 rounded-r-lg p-4 my-4"
                >
                  <p className="text-yellow-200 italic text-lg leading-relaxed">
                    {item.content.replace(/^["']|["']$/g, "")}
                  </p>
                </div>
              );
            }

            if (item.type === "checklist") {
              return (
                <ChecklistItem
                  key={`checklist-${index}`}
                  content={item.content}
                  checked={item.checked || false}
                  activityId={activityId}
                  lineIndex={index}
                />
              );
            }

            if (item.type === "list") {
              const cleanedContent = item.content
                .replace(/^[-•]\s*/, "")
                .replace(/^\d+[\.\)]\s*/, "");
              return (
                <div key={`item-${index}`} className="flex items-start gap-3 my-3 pl-2">
                  <span className="text-[#00D4B3] mt-1.5 text-lg font-bold">•</span>
                  <p
                    className="text-[#0A2540] dark:text-white leading-relaxed flex-1 text-base"
                    style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                  >
                    {cleanedContent}
                  </p>
                </div>
              );
            }

            const hasExamples = item.content.match(/Ejemplos?[:]?/i);
            const hasQuotes = item.content.match(/["']/g);

            if (hasExamples && hasQuotes && hasQuotes.length >= 2) {
              const parts = item.content.split(/(["'][^"']+["'])/g);
              return (
                <p
                  key={`item-${index}`}
                  className="text-[#0A2540] dark:text-white leading-relaxed mb-6 text-base"
                  style={{ lineHeight: "1.9", fontFamily: "Inter, sans-serif", fontWeight: 400 }}
                >
                  {parts.map((part, partIndex) =>
                    part.match(/^["']/) ? (
                      <span
                        key={partIndex}
                        className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 px-2 py-1 rounded text-[#00D4B3] dark:text-[#00D4B3] font-medium"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                      >
                        {part.replace(/^["']|["']$/g, "")}
                      </span>
                    ) : (
                      <span key={partIndex}>{part}</span>
                    )
                  )}
                </p>
              );
            }

            return (
              <p
                key={`item-${index}`}
                className="text-[#0A2540] dark:text-white leading-relaxed mb-6 text-base"
                style={{ lineHeight: "1.9", fontFamily: "Inter, sans-serif", fontWeight: 400 }}
              >
                {item.content}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
}
