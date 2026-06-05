/**
 * Approximate read-along highlighting.
 *
 * We play a single pre-generated MP3 and don't have per-word timestamps from the
 * provider, so we estimate which sentence is being spoken by distributing the audio
 * duration across the text proportionally to each sentence's character length. It is
 * intentionally approximate (it can't model pauses or emphasis) but stays cheap and
 * needs no audio regeneration. Sentence granularity tolerates the drift far better
 * than word granularity would.
 */

export interface TimedSegment {
  charEnd: number;
  charStart: number;
  text: string;
}

/** Splits text into sentences, keeping trailing punctuation and whitespace with each. */
export function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?\n]+[.!?]*[\s\n]*/g);
  if (!matches) return text.trim() ? [text] : [];
  return matches.filter((sentence) => sentence.trim().length > 0);
}

/** Assigns cumulative character ranges to a list of text pieces. */
export function buildTimedSegments(pieces: string[]): {
  segments: TimedSegment[];
  totalChars: number;
} {
  let offset = 0;
  const segments = pieces.map((text) => {
    const segment: TimedSegment = { charStart: offset, charEnd: offset + text.length, text };
    offset += text.length;
    return segment;
  });
  return { segments, totalChars: offset };
}

/**
 * Index of the segment estimated to be playing at `currentTime`, or -1 when there is
 * nothing to highlight (no duration yet, or playback hasn't reached any segment).
 */
export function getActiveSegmentIndex(
  segments: TimedSegment[],
  totalChars: number,
  currentTime: number,
  duration: number,
): number {
  if (duration <= 0 || totalChars <= 0 || segments.length === 0) return -1;

  const ratio = Math.min(Math.max(currentTime / duration, 0), 1);
  const targetChar = ratio * totalChars;

  for (let index = 0; index < segments.length; index += 1) {
    if (targetChar < segments[index].charEnd) return index;
  }
  return segments.length - 1;
}
