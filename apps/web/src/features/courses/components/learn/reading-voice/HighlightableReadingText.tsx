"use client";

import { useMemo } from "react";

import { buildTimedSegments, getActiveSegmentIndex, splitSentences } from "./reading-highlight";

interface HighlightableReadingTextProps {
  /** Whether playback is active (playing or paused) so a sentence should be highlighted. */
  isActive: boolean;
  currentTime: number;
  duration: number;
  text: string;
}

const HIGHLIGHT_CLASS =
  "rounded bg-accent/20 text-primary shadow-[0_0_0_2px_rgba(0,212,179,0.12)] dark:bg-accent/25 dark:text-white";

/**
 * Renders reading text split into paragraphs and sentences, highlighting the sentence
 * estimated to be playing. Used as the summary body during audio playback so the user
 * can follow along; the timing comes from the approximate model in `reading-highlight`.
 */
export function HighlightableReadingText({
  currentTime,
  duration,
  isActive,
  text,
}: HighlightableReadingTextProps) {
  const { paragraphs, segments, totalChars } = useMemo(() => {
    const rawParagraphs = text.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
    const grouped = rawParagraphs.map((paragraph) => splitSentences(paragraph));
    const { segments: flatSegments, totalChars: total } = buildTimedSegments(grouped.flat());
    return { paragraphs: grouped, segments: flatSegments, totalChars: total };
  }, [text]);

  const activeIndex = isActive
    ? getActiveSegmentIndex(segments, totalChars, currentTime, duration)
    : -1;

  let globalIndex = 0;

  return (
    <div className="space-y-4 text-base leading-[1.9] text-gray-800 dark:text-white/90">
      {paragraphs.map((sentences, paragraphIndex) => (
        <p key={`p-${paragraphIndex}`}>
          {sentences.map((sentence, sentenceIndex) => {
            const index = globalIndex;
            globalIndex += 1;
            const isHighlighted = index === activeIndex;
            return (
              <span
                key={`s-${paragraphIndex}-${sentenceIndex}`}
                className={`transition-colors duration-300 ${isHighlighted ? HIGHLIGHT_CLASS : ""}`}
              >
                {sentence}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
