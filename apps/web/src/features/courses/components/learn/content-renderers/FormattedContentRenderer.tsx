"use client";

import { useEffect, useRef } from "react";
import { normalizeContentForRenderer } from "@/lib/course-content";
import { sanitizeRichHtml } from "@/lib/security/sanitize-html";
import {
  buildFormattedContent,
  isHtmlReadingContent,
  type FormattedContentItem,
} from "@/lib/reading/reading-segmentation";

// El subrayado sigue el SEGMENTO que realmente está sonando (`activeSegmentIndex`),
// alineado 1:1 con los bloques de `buildFormattedContent` (única fuente de verdad
// en `lib/reading/reading-segmentation.ts`). Antes se estimaba por proporción de
// caracteres, lo que desincronizaba el subrayado respecto del audio.

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

// ─── Scroll suave sin parpadeo ────────────────────────────────────────────────
//
// En iOS, llamar `scrollIntoView({block:'center'})` en cada cambio mueve la
// página constantemente y se percibe como parpadeo. Solo desplazamos cuando el
// bloque activo está FUERA del viewport, y con `block:'nearest'` (mínimo
// movimiento). Como el índice activo cambia ~1 vez por párrafo (no ~200 veces),
// los re-renders se reducen drásticamente.

function scrollBlockIntoViewIfNeeded(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const isFullyVisible = rect.top >= 0 && rect.bottom <= viewportHeight;
  if (!isFullyVisible) {
    element.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ─── Estilo del bloque en lectura ─────────────────────────────────────────────
//
// IMPORTANTE: usar nombres de color de Tailwind (accent, primary), NO
// `bg-[var(--color-accent)]`, porque el modificador de opacidad (/10, /20)
// requiere color en formato RGB internamente. Sin transición CSS: al saltar de
// un bloque a otro, transicionar ambos los deja medio-resaltados ~200 ms (flicker).

function getBlockReadingClass(isActive: boolean, isReading: boolean): string {
  if (!isReading) return "";
  if (isActive) {
    return "border-l-4 border-accent bg-accent/10 pl-3 rounded-r-md dark:bg-accent/20";
  }
  return "opacity-60";
}

// ─── Subrayado de contenido HTML ──────────────────────────────────────────────
//
// El HTML se renderiza vía innerHTML, así que resaltamos por DOM: marcamos el
// nodo de bloque número `activeSegmentIndex` (mismo orden que segmenta
// `segmentReadingContent` en cliente → alineado con el audio que suena).

function useHtmlReadingHighlight(
  articleRef: React.RefObject<HTMLElement | null>,
  activeSegmentIndex: number,
  isPlaying: boolean,
) {
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    const clearHighlights = () =>
      el.querySelectorAll('.tts-reading').forEach((n) => n.classList.remove('tts-reading'));

    if (!isPlaying || activeSegmentIndex < 0) {
      clearHighlights();
      return;
    }

    const nodes = el.querySelectorAll('p, li, h1, h2, h3, h4, h5, blockquote');
    const activeNode = nodes[activeSegmentIndex] as HTMLElement | undefined;
    if (!activeNode) return;

    if (!activeNode.classList.contains('tts-reading')) {
      clearHighlights();
      activeNode.classList.add('tts-reading');
      scrollBlockIntoViewIfNeeded(activeNode);
    }
  }, [articleRef, activeSegmentIndex, isPlaying]);
}

// ─── HTML content renderer ────────────────────────────────────────────────────

function HtmlContentRenderer({
  html,
  activeSegmentIndex,
  isPlaying,
}: {
  html: string;
  activeSegmentIndex: number;
  isPlaying: boolean;
}) {
  const articleRef = useRef<HTMLElement | null>(null);
  useHtmlReadingHighlight(articleRef, activeSegmentIndex, isPlaying);
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
          "[&_.tts-reading]:border-l-4 [&_.tts-reading]:border-accent",
          "[&_.tts-reading]:bg-accent/10 [&_.tts-reading]:pl-3 [&_.tts-reading]:rounded-r-md",
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
  activeSegmentIndex = -1,
  isPlaying,
}: {
  content: unknown;
  activityId?: string;
  /** Índice del segmento que se está reproduciendo (-1 si no hay reproducción). */
  activeSegmentIndex?: number;
  isPlaying?: boolean;
}) {
  const readingContent = normalizeContentForRenderer(content);
  const activeBlockRef = useRef<HTMLElement | null>(null);

  if (!readingContent.trim()) return null;

  const reading = isPlaying ?? false;
  const activeIndex = reading ? activeSegmentIndex : -1;

  if (isHtmlReadingContent(readingContent)) {
    return (
      <HtmlContentRenderer
        html={readingContent}
        activeSegmentIndex={activeIndex}
        isPlaying={reading}
      />
    );
  }

  const formattedContent = buildFormattedContent(readingContent);

  return (
    <FormattedContentWithScroll
      formattedContent={formattedContent}
      activeBlockIndex={activeIndex}
      isPlaying={reading}
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
    scrollBlockIntoViewIfNeeded(activeBlockRef.current);
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
