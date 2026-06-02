"use client";

import { useEffect, useRef } from "react";
import { normalizeContentForRenderer } from "@/lib/course-content";
import { sanitizeRichHtml } from "@/lib/security/sanitize-html";

type FormattedContentItem = {
  content: string;
  type:
    | "checklist"
    | "example"
    | "highlight"
    | "list"
    | "main-title"
    | "paragraph"
    | "section-title"
    | "subsection-title";
  checked?: boolean;
};

function buildFormattedContent(readingContent: string): FormattedContentItem[] {
  const lines = readingContent
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index, allLines) => {
    const checklistMatch = line.match(/^\[([\sxX])\]\s*(.+)$/);
    if (checklistMatch) {
      return {
        checked: checklistMatch[1].toLowerCase() === "x",
        content: checklistMatch[2].trim(),
        type: "checklist",
      } satisfies FormattedContentItem;
    }

    if (
      /^(Introducción|Introduccion|Cuerpo|Cierre|Conclusión|Conclusion|Resumen):?$/iu.test(line)
    ) {
      return { content: line.replace(/:$/, ""), type: "main-title" } satisfies FormattedContentItem;
    }

    if (/^(\d+)[.)]\s+(.+)$/u.test(line) && line.length < 120) {
      return { content: line, type: "subsection-title" } satisfies FormattedContentItem;
    }

    if (
      line.length < 90 &&
      /^[A-ZÁÉÍÓÚÑ][^.!?]*$/u.test(line) &&
      !line.includes(":") &&
      index < allLines.length - 1 &&
      (allLines[index + 1]?.length || 0) > 50
    ) {
      return { content: line, type: "section-title" } satisfies FormattedContentItem;
    }

    if (/^Ejemplos?:?/iu.test(line) || /por ejemplo/iu.test(line)) {
      return { content: line, type: "example" } satisfies FormattedContentItem;
    }

    if (
      (line.startsWith('"') && line.endsWith('"')) ||
      (line.startsWith("'") && line.endsWith("'"))
    ) {
      return { content: line.slice(1, -1), type: "highlight" } satisfies FormattedContentItem;
    }

    if (/^[-*•]\s+/u.test(line)) {
      return { content: line.replace(/^[-*•]\s+/u, ""), type: "list" } satisfies FormattedContentItem;
    }

    return { content: line, type: "paragraph" } satisfies FormattedContentItem;
  });
}

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

// ─── Character-proportional active block calculation ─────────────────────────
//
// Audio time tracks the SPOKEN char count (without markdown markup), not the
// raw block text length. `**Cuantificación del Costo Oculto:**` reads as
// "Cuantificación del Costo Oculto:" — 4 chars shorter. If we count raw block
// text we get an inflated total → progress × total falls beyond what the
// audio actually read → highlight runs ahead of the voice.

function countSpokenChars(s: string): number {
  return s
    .replace(/<[^>]+>/g, '')                         // strip HTML
    .replace(/\*\*([^*]+)\*\*/g, '$1')               // strip bold **
    .replace(/__([^_]+)__/g, '$1')                   // strip bold __
    .replace(/([^*])\*([^*]+)\*([^*])/g, '$1$2$3')   // strip italic *
    .replace(/`([^`]+)`/g, '$1')                     // strip inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')         // strip markdown links
    .length;
}

function computeActiveBlockByChars(
  blocks: FormattedContentItem[],
  progress: number | undefined,
  isPlaying: boolean | undefined,
): number {
  if (!isPlaying || progress === undefined || progress <= 0 || blocks.length === 0) {
    return -1;
  }

  // Pre-compute spoken-char counts once per render (matches what TTS read)
  const lengths = blocks.map((b) => Math.max(countSpokenChars(b.content), 1));
  const totalChars = lengths.reduce((a, b) => a + b, 0);
  if (totalChars === 0) return -1;

  // Bias the highlight 2% behind the audio: TTS reads short words faster than
  // long ones (a pure char-proportional model can't capture that). A small
  // lag is far less jarring than the highlight running ahead of the voice.
  const biasedProgress = Math.max(0, progress - 0.02);
  const charsTarget = biasedProgress * totalChars;
  let cumulative = 0;
  for (let i = 0; i < lengths.length; i++) {
    cumulative += lengths[i];
    if (charsTarget <= cumulative) return i;
  }
  return blocks.length - 1;
}

// ─── Block reading styles ─────────────────────────────────────────────────────
//
// IMPORTANT: use Tailwind color names (accent, primary) — NOT CSS variable
// syntax like bg-[var(--color-accent)] — because Tailwind's opacity modifier
// (/10, /20…) requires the color to be in RGB format internally.
// With hex CSS variables, /N opacity silently produces transparent.

function getBlockReadingClass(isActive: boolean, isReading: boolean): string {
  if (!isReading) return "";
  // No CSS transition between active/inactive states — when the highlight
  // jumps from block A to block B, transitioning both makes them appear
  // half-highlighted for 200 ms, which reads as "flicker".
  if (isActive) {
    return "rounded-md bg-accent/10 ring-1 ring-accent/20 dark:bg-accent/20";
  }
  return "";
}

function scrollIntoViewIfNeeded(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const isVisible = rect.top >= 96 && rect.bottom <= viewportHeight - 48;

  if (isVisible) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'nearest',
  });
}

// ─── HTML content reading hook ────────────────────────────────────────────────
//
// For HTML content we can't split into React elements, so we manipulate the
// DOM directly via a ref. Every time playbackProgress changes we:
//   1. Remove the active class from the previous element
//   2. Add it to the estimated current element (progress × total paragraphs)
//   3. Scroll it into view
//
// The Tailwind arbitrary-variant on the article wrapper
// `[&_.tts-reading]:...` styles the active element without needing a CSS file.

function useHtmlReadingHighlight(
  articleRef: React.RefObject<HTMLElement | null>,
  playbackProgress: number | undefined,
  isPlaying: boolean,
) {
  const activeIndexRef = useRef(-1);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    // Clear all highlights when not playing
    if (!isPlaying || !playbackProgress) {
      el.querySelectorAll('.tts-reading').forEach((n) => n.classList.remove('tts-reading'));
      activeIndexRef.current = -1;
      return;
    }

    const nodes = el.querySelectorAll('p, li, h1, h2, h3, h4, h5, blockquote');
    if (!nodes.length) return;

    // Character-proportional mapping: audio time is proportional to text length,
    // not to node count. Normalize whitespace to match the TTS hook's char count
    // — otherwise newlines/indentation from formatted HTML inflate the total
    // and cause the highlight to drift ahead of the voice.
    const lengths: number[] = [];
    let totalChars = 0;
    nodes.forEach((node) => {
      const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
      const len = Math.max(text.length, 1);
      lengths.push(len);
      totalChars += len;
    });

    // 2% bias backward: keeps the highlight slightly behind the voice so
    // pace variations in the TTS don't make it overshoot.
    const biased = Math.max(0, playbackProgress - 0.02);
    const charsTarget = biased * totalChars;
    let cumulative = 0;
    let activeIdx = nodes.length - 1;
    for (let i = 0; i < lengths.length; i++) {
      cumulative += lengths[i];
      if (charsTarget <= cumulative) { activeIdx = i; break; }
    }

    if (activeIdx === activeIndexRef.current) {
      return;
    }

    activeIndexRef.current = activeIdx;
    el.querySelectorAll('.tts-reading').forEach((n) => n.classList.remove('tts-reading'));
    const activeNode = nodes[activeIdx] as HTMLElement | undefined;
    if (!activeNode) return;

    activeNode.classList.add('tts-reading');
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      scrollIntoViewIfNeeded(activeNode);
    }, 120);
  }, [articleRef, playbackProgress, isPlaying]);

  useEffect(() => () => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
  }, []);
}

// ─── HTML content renderer ────────────────────────────────────────────────────

function HtmlContentRenderer({
  html,
  playbackProgress,
  isPlaying,
}: {
  html: string;
  playbackProgress: number | undefined;
  isPlaying: boolean;
}) {
  const articleRef = useRef<HTMLElement | null>(null);
  useHtmlReadingHighlight(articleRef, playbackProgress, isPlaying);
  const sanitized = sanitizeRichHtml(html);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[var(--color-legacy-10161d)]">
      <article
        ref={articleRef as React.RefObject<HTMLElement>}
        className={[
          "prose prose-slate max-w-none overflow-x-auto text-primary",
          "dark:prose-invert dark:text-white",
          "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse",
          "[&_td]:border [&_td]:border-gray-200 [&_td]:p-3 dark:[&_td]:border-white/10",
          "[&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:p-3 [&_th]:text-left",
          "dark:[&_th]:border-white/20 dark:[&_th]:bg-white/10",
          // Active element styling via DOM class (no transition — see plain path)
          "[&_.tts-reading]:bg-accent/10 [&_.tts-reading]:rounded-md",
          "[&_.tts-reading]:ring-1 [&_.tts-reading]:ring-accent/20",
          "[&_.tts-reading]:dark:bg-accent/20",
        ].join(" ")}
        dangerouslySetInnerHTML={{ __html: sanitized }}
        style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FormattedContentRenderer({
  content,
  activityId: _activityId,
  playbackProgress,
  isPlaying,
}: {
  content: unknown;
  activityId?: string;
  playbackProgress?: number;
  isPlaying?: boolean;
}) {
  const readingContent = normalizeContentForRenderer(content);
  const activeBlockRef = useRef<HTMLElement | null>(null);

  if (!readingContent.trim()) return null;

  // ── HTML rich content ──────────────────────────────────────────────────────
  if (/<[a-z][\s\S]*>/i.test(readingContent)) {
    return (
      <HtmlContentRenderer
        html={readingContent}
        playbackProgress={playbackProgress}
        isPlaying={isPlaying ?? false}
      />
    );
  }

  // ── Plain formatted content ────────────────────────────────────────────────
  const formattedContent = buildFormattedContent(readingContent);
  // Map progress to characters read instead of block index — a long paragraph
  // takes much more audio time than a short title, so a linear block mapping
  // makes the highlight "jump" past short titles too fast.
  const activeBlockIndex = computeActiveBlockByChars(
    formattedContent,
    playbackProgress,
    isPlaying,
  );

  return (
    <FormattedContentWithScroll
      formattedContent={formattedContent}
      activeBlockIndex={activeBlockIndex}
      isPlaying={isPlaying ?? false}
      activeBlockRef={activeBlockRef}
    />
  );
}

// ─── Formatted content with scroll tracking ───────────────────────────────────

function FormattedContentWithScroll({
  formattedContent,
  activeBlockIndex,
  isPlaying,
  activeBlockRef,
}: {
  formattedContent: FormattedContentItem[];
  activeBlockIndex: number;
  isPlaying: boolean;
  activeBlockRef: React.MutableRefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!isPlaying || activeBlockIndex < 0 || !activeBlockRef.current) return;
    const timeoutId = window.setTimeout(() => {
      if (activeBlockRef.current) {
        scrollIntoViewIfNeeded(activeBlockRef.current);
      }
    }, 120);
    return () => window.clearTimeout(timeoutId);
  }, [activeBlockIndex, isPlaying, activeBlockRef]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[var(--color-legacy-10161d)]">
      <article className="space-y-5">
        {formattedContent.map((item, index) => {
          const isActive = index === activeBlockIndex;
          const cls = getBlockReadingClass(isActive, isPlaying);

          // Stable ref callback: only the active block needs the ref
          const refCb = isActive
            ? (el: HTMLElement | null) => { activeBlockRef.current = el; }
            : undefined;

          if (item.type === "main-title") {
            return (
              <h1
                key={`item-${index}`}
                ref={refCb}
                className={`border-b border-primary/15 pb-3 text-3xl font-bold text-primary dark:border-accent/20 dark:text-white ${cls}`}
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
              >
                {item.content}
              </h1>
            );
          }

          if (item.type === "section-title") {
            return (
              <h2
                key={`item-${index}`}
                ref={refCb}
                className={`text-2xl font-bold text-primary dark:text-white ${cls}`}
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
              >
                {item.content}
              </h2>
            );
          }

          if (item.type === "subsection-title") {
            const match = item.content.match(/^(\d+)[.)]\s+(.+)$/u);
            return (
              <div
                key={`item-${index}`}
                ref={refCb as React.RefCallback<HTMLDivElement>}
                className={`flex items-center gap-3 text-primary dark:text-[var(--color-legacy-d6fff8)] ${cls}`}
              >
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
              <div
                key={`item-${index}`}
                ref={refCb as React.RefCallback<HTMLDivElement>}
                className={`rounded-xl border-l-4 border-primary/30 bg-[var(--color-legacy-f5f8fc)] px-4 py-3 dark:border-accent/35 dark:bg-[var(--color-legacy-0b1a20)] ${cls}`}
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-primary dark:text-[var(--color-legacy-98f5e4)]">Ejemplo</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-white/80">{item.content}</p>
              </div>
            );
          }

          if (item.type === "highlight") {
            return (
              <div
                key={`item-${index}`}
                ref={refCb as React.RefCallback<HTMLDivElement>}
                className={`rounded-xl border border-[var(--color-legacy-f3d98b)] bg-[var(--color-legacy-fff7da)] px-4 py-3 dark:border-[color-mix(in_srgb,var(--color-legacy-8a6d1f)_50%,transparent)] dark:bg-[var(--color-legacy-2b2410)] ${cls}`}
              >
                <p className="text-lg italic leading-relaxed text-[var(--color-legacy-5b4a18)] dark:text-[var(--color-legacy-f7e7a8)]">
                  {item.content}
                </p>
              </div>
            );
          }

          if (item.type === "checklist") {
            return (
              <div
                key={`item-${index}`}
                ref={refCb as React.RefCallback<HTMLDivElement>}
                className={cls}
              >
                <StaticChecklistItem checked={item.checked === true} content={item.content} />
              </div>
            );
          }

          if (item.type === "list") {
            return (
              <div
                key={`item-${index}`}
                ref={refCb as React.RefCallback<HTMLDivElement>}
                className={`flex items-start gap-3 ${cls}`}
              >
                <span className="mt-1 text-lg font-bold text-primary dark:text-accent">-</span>
                <p className="flex-1 text-base leading-relaxed text-primary dark:text-white">{item.content}</p>
              </div>
            );
          }

          return (
            <p
              key={`item-${index}`}
              ref={refCb as React.RefCallback<HTMLParagraphElement>}
              className={`text-base leading-[1.9] text-primary dark:text-white ${cls}`}
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
            >
              {item.content}
            </p>
          );
        })}
      </article>
    </div>
  );
}
