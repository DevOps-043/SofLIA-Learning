"use client";

import type { ReactNode } from "react";

import { normalizeContentForRenderer } from "@/lib/course-content";
import {
  buildFormattedContent,
  isHtmlReadingContent,
} from "@/lib/reading/reading-segmentation";
import { sanitizeRichHtml } from "@/lib/security/sanitize-html";
import {
  buildTimedSegments,
  getActiveSegmentIndex,
} from "@/features/courses/components/learn/reading-voice/reading-highlight";

type FormattedItem = ReturnType<typeof buildFormattedContent>[number];

function StaticChecklistItem({ checked, content }: { checked: boolean; content: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[var(--color-legacy-10161d)]">
      <span
        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-[11px] font-bold ${
          checked
            ? "border-primary bg-primary text-white dark:border-accent dark:bg-accent dark:text-[var(--color-legacy-08141f)]"
            : "border-gray-300 text-transparent dark:border-white/20"
        }`}
      >
        ✓
      </span>
      <p className={`text-base leading-relaxed ${checked ? "text-gray-500 line-through dark:text-white/55" : "text-gray-800 dark:text-white"}`}>
        {content}
      </p>
    </div>
  );
}

function HtmlContentRenderer({ html }: { html: string }) {
  const sanitized = sanitizeRichHtml(html);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[var(--color-legacy-10161d)]">
      <article
        className={[
          "prose prose-slate max-w-none overflow-x-auto text-primary",
          "dark:prose-invert dark:text-white",
          "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse",
          "[&_td]:border [&_td]:border-gray-200 [&_td]:p-3 dark:[&_td]:border-white/10",
          "[&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:p-3 [&_th]:text-left",
          "dark:[&_th]:border-white/20 dark:[&_th]:bg-white/10",
        ].join(" ")}
        dangerouslySetInnerHTML={{ __html: sanitized }}
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
      />
    </div>
  );
}

function renderFormattedItem(item: FormattedItem): ReactNode {
  if (item.type === "main-title") {
    return (
      <h1
        className="border-b border-primary/15 pb-3 text-3xl font-bold text-primary dark:border-accent/20 dark:text-white"
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
      >
        {item.content}
      </h1>
    );
  }

  if (item.type === "section-title") {
    return (
      <h2
        className="text-2xl font-bold text-primary dark:text-white"
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
      >
        {item.content}
      </h2>
    );
  }

  if (item.type === "subsection-title") {
    const match = item.content.match(/^(\d+)[.)]\s+(.+)$/u);
    return (
      <div className="flex items-center gap-3 text-primary dark:text-[var(--color-legacy-d6fff8)]">
        {match ? (
          <>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 text-lg font-bold dark:border-accent/25 dark:bg-accent/10 dark:text-accent">
              {match[1]}
            </span>
            <h3 className="text-xl font-semibold">{match[2]}</h3>
          </>
        ) : (
          <h3 className="text-xl font-semibold">{item.content}</h3>
        )}
      </div>
    );
  }

  if (item.type === "example") {
    return (
      <div className="rounded-xl border-l-4 border-primary/30 bg-[var(--color-legacy-f5f8fc)] px-4 py-3 dark:border-accent/35 dark:bg-[var(--color-legacy-0b1a20)]">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary dark:text-[var(--color-legacy-98f5e4)]">Ejemplo</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-white/80">{item.content}</p>
      </div>
    );
  }

  if (item.type === "highlight") {
    return (
      <div className="rounded-xl border border-[var(--color-legacy-f3d98b)] bg-[var(--color-legacy-fff7da)] px-4 py-3 dark:border-[color-mix(in_srgb,var(--color-legacy-8a6d1f)_50%,transparent)] dark:bg-[var(--color-legacy-2b2410)]">
        <p className="text-lg italic leading-relaxed text-[var(--color-legacy-5b4a18)] dark:text-[var(--color-legacy-f7e7a8)]">
          {item.content}
        </p>
      </div>
    );
  }

  if (item.type === "checklist") {
    return <StaticChecklistItem checked={item.checked === true} content={item.content} />;
  }

  if (item.type === "list") {
    return (
      <div className="flex items-start gap-3">
        <span className="mt-1 text-lg font-bold text-primary dark:text-accent">-</span>
        <p className="flex-1 text-base leading-relaxed text-primary dark:text-white">{item.content}</p>
      </div>
    );
  }

  return (
    <p
      className="text-base leading-[1.9] text-primary dark:text-white"
      style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
    >
      {item.content}
    </p>
  );
}

interface FormattedContentRendererProps {
  content: unknown;
  activityId?: string;
  /** Optional read-along highlighting driven by the audio player's clock. */
  currentTime?: number;
  duration?: number;
  isAudioActive?: boolean;
}

export function FormattedContentRenderer({
  content,
  currentTime = 0,
  duration = 0,
  isAudioActive = false,
}: FormattedContentRendererProps) {
  const readingContent = normalizeContentForRenderer(content);

  if (!readingContent.trim()) return null;

  if (isHtmlReadingContent(readingContent)) {
    return <HtmlContentRenderer html={readingContent} />;
  }

  const formattedContent = buildFormattedContent(readingContent);

  // Approximate read-along: highlight the block estimated to be playing. Only the
  // spoken text blocks count toward the timeline; structural items still render.
  const { segments, totalChars } = buildTimedSegments(
    formattedContent.map((item) => item.content ?? ""),
  );
  const activeIndex = isAudioActive
    ? getActiveSegmentIndex(segments, totalChars, currentTime, duration)
    : -1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[var(--color-legacy-10161d)]">
      <article className="space-y-5">
        {formattedContent.map((item, index) => (
          <div
            key={`item-${index}`}
            className={
              index === activeIndex
                ? "-mx-2 rounded-lg bg-accent/10 px-2 py-1 transition-colors duration-300 dark:bg-accent/15"
                : "transition-colors duration-300"
            }
          >
            {renderFormattedItem(item)}
          </div>
        ))}
      </article>
    </div>
  );
}
