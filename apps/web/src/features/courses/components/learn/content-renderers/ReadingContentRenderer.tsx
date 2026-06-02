"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

import { normalizeContentForRenderer } from "@/lib/course-content";
import { sanitizeRichHtml } from "@/lib/security/sanitize-html";
import { ReadableAudioControl } from "../audio/ReadableAudioControl";
import type { ReadableAudioSource } from "../audio/useReadableAudioPlayback";

const READING_FONT_SIZES = [
  {
    className: "text-sm",
    labelKey: "reading.fontSizeSmall",
    proseClassName: "prose-sm",
  },
  {
    className: "text-base",
    labelKey: "reading.fontSizeDefault",
    proseClassName: "prose-base",
  },
  {
    className: "text-lg",
    labelKey: "reading.fontSizeLarge",
    proseClassName: "prose-lg",
  },
] as const;

export function ReadingContentRenderer({
  audioSource,
  content,
}: {
  audioSource?: Omit<ReadableAudioSource, "content">;
  content: unknown;
}) {
  const { t } = useTranslation("learn");
  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  const readingContent = normalizeContentForRenderer(content);
  const fontSize = READING_FONT_SIZES[fontSizeIndex];

  if (!readingContent.trim()) {
    return null;
  }

  const fontSizeControls = (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
      {audioSource ? (
        <ReadableAudioControl
          source={{
            ...audioSource,
            content,
          }}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600 dark:text-white/60">
          {t("reading.fontSize")}
        </span>
        <button
          type="button"
          onClick={() => setFontSizeIndex((currentIndex) => Math.max(0, currentIndex - 1))}
          disabled={fontSizeIndex === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:text-accent"
          aria-label={t("reading.decreaseFontSize")}
          title={t("reading.decreaseFontSize")}
        >
          A-
        </button>
        <span className="min-w-20 text-center text-xs text-gray-600 dark:text-white/60">
          {t(fontSize.labelKey)}
        </span>
        <button
          type="button"
          onClick={() =>
            setFontSizeIndex((currentIndex) =>
              Math.min(READING_FONT_SIZES.length - 1, currentIndex + 1)
            )
          }
          disabled={fontSizeIndex === READING_FONT_SIZES.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:text-accent"
          aria-label={t("reading.increaseFontSize")}
          title={t("reading.increaseFontSize")}
        >
          A+
        </button>
      </div>
    </div>
  );

  if (/<[a-z][\s\S]*>/i.test(readingContent)) {
    const sanitizedReadingContent = sanitizeRichHtml(readingContent);

    return (
      <div className="py-2">
        {fontSizeControls}
        <article
          className={`prose prose-slate ${fontSize.proseClassName} dark:prose-invert max-w-none text-gray-900 dark:text-white leading-relaxed overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-sm [&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-white/20 [&_th]:bg-gray-100 dark:[&_th]:bg-white/10 [&_th]:p-3 [&_th]:font-semibold [&_th]:text-left [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-white/10 [&_td]:p-3`}
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 400 }}
          dangerouslySetInnerHTML={{ __html: sanitizedReadingContent }}
        />
      </div>
    );
  }

  const lines = readingContent.split("\n");

  const renderContent = () => {
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length === 0) return;
      elements.push(
        <p
          key={`paragraph-${elements.length}`}
          className={`text-gray-800 dark:text-white/80 ${fontSize.className} leading-[1.8] mb-4`}
        >
          {currentParagraph.join(" ")}
        </p>
      );
      currentParagraph = [];
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        flushParagraph();
        return;
      }

      const mainSectionMatch = trimmedLine.match(
        /^(Introducci[o\u00f3]n|Cuerpo|Cierre|Conclusi[o\u00f3]n|Resumen):?\s*(.*)$/i
      );
      if (mainSectionMatch) {
        flushParagraph();
        elements.push(
          <div key={`main-${index}`} className="mt-8 mb-4 first:mt-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {mainSectionMatch[1]}
            </h2>
            {mainSectionMatch[2] && (
              <p className={`text-gray-600 dark:text-white/60 ${fontSize.className}`}>
                {mainSectionMatch[2]}
              </p>
            )}
            <div className="w-12 h-0.5 bg-gray-200 dark:bg-white/10 mt-3" />
          </div>
        );
        return;
      }

      const stepMatch = trimmedLine.match(/^(Paso\s+\d+):?\s*(.*)$/i);
      if (stepMatch) {
        flushParagraph();
        elements.push(
          <div key={`step-${index}`} className="mt-6 mb-3 flex items-start gap-3">
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-[10px] font-medium text-gray-600 dark:text-white/60 uppercase tracking-wider flex-shrink-0">
              {stepMatch[1]}
            </span>
            {stepMatch[2] && (
              <span className={`text-gray-900 dark:text-white font-medium ${fontSize.className}`}>
                {stepMatch[2]}
              </span>
            )}
          </div>
        );
        return;
      }

      const numberedMatch = trimmedLine.match(/^(\d+)[\.\)]\s+(.+)$/);
      if (numberedMatch && trimmedLine.length < 120) {
        flushParagraph();
        elements.push(
          <div key={`numbered-${index}`} className="mt-5 mb-3 flex items-baseline gap-3">
            <span className="text-gray-500 dark:text-white/40 text-xs font-medium">
              {numberedMatch[1]}.
            </span>
            <h3 className={`text-gray-900 dark:text-white font-medium ${fontSize.className}`}>
              {numberedMatch[2]}
            </h3>
          </div>
        );
        return;
      }

      const refMatch = trimmedLine.match(/^\(?(Referencia|Ref|Ver|Nota):?\s*(.+)\)?$/i);
      if (refMatch) {
        flushParagraph();
        elements.push(
          <div key={`ref-${index}`} className="mt-2 mb-3 pl-3 border-l-2 border-gray-200 dark:border-white/10">
            <p className="text-gray-600 dark:text-white/50 text-xs italic">
              {trimmedLine}
            </p>
          </div>
        );
        return;
      }

      if (trimmedLine.endsWith(":") && trimmedLine.length < 80 && trimmedLine.length > 5) {
        flushParagraph();
        elements.push(
          <h4
            key={`heading-${index}`}
            className={`text-gray-900 dark:text-white/90 font-medium ${fontSize.className} mt-5 mb-2`}
          >
            {trimmedLine}
          </h4>
        );
        return;
      }

      const listMatch = trimmedLine.match(/^[-•●○]\s+(.+)$/);
      if (listMatch) {
        flushParagraph();
        elements.push(
          <div key={`list-${index}`} className="flex items-start gap-2 mb-2 pl-2">
            <span className="text-gray-500 dark:text-white/40 mt-1.5">•</span>
            <span className={`text-gray-800 dark:text-white/70 ${fontSize.className} leading-relaxed`}>
              {listMatch[1]}
            </span>
          </div>
        );
        return;
      }

      currentParagraph.push(trimmedLine);
    });

    flushParagraph();
    return elements;
  };

  return (
    <div className="py-2">
      {fontSizeControls}
      <article className="max-w-none">{renderContent()}</article>
    </div>
  );
}
