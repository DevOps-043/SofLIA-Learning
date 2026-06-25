"use client";

import type { TFunction } from "i18next";
import { Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { ChangeEvent } from "react";

import type {
  ReadingAudioStatus,
  UseReadingAudioPlayerReturn,
} from "./useReadingAudioPlayer";

interface ReadingAudioPlayerProps {
  player: UseReadingAudioPlayerReturn;
  t: TFunction<"learn">;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusLabel(status: ReadingAudioStatus, t: TFunction<"learn">): string {
  if (status === "loading") return t("reading.voice.loading");
  if (status === "playing") return t("reading.voice.pause");
  if (status === "paused") return t("reading.voice.resume");
  if (status === "unavailable") return t("reading.voice.unavailable");
  if (status === "error") return t("reading.voice.error");
  return t("reading.voice.listen");
}

/**
 * Inline reading-audio player: a play/pause control plus a draggable progress bar so
 * the user can scrub to any position. Streams the pre-generated MP3 from storage.
 */
export function ReadingAudioPlayer({ player, t }: ReadingAudioPlayerProps) {
  const { currentTime, duration, seek, status, toggle } = player;

  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const isPaused = status === "paused";
  const isUnavailable = status === "unavailable";
  const isError = status === "error";
  const hasTrack = duration > 0;
  const label = getStatusLabel(status, t);

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    seek(Number(event.target.value));
  };

  // Before the track is loaded, show a compact trigger button only.
  if (status === "idle" || isLoading || isUnavailable || (isError && !hasTrack)) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (!isUnavailable) void toggle();
        }}
        disabled={isLoading || isUnavailable}
        title={label}
        aria-label={label}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors
          ${isUnavailable ? "text-gray-400 dark:text-white/30" : ""}
          ${isError ? "text-red-500 dark:text-red-400" : ""}
          ${!isUnavailable && !isError ? "text-gray-500 hover:bg-gray-200 dark:text-white/50 dark:hover:bg-white/10" : ""}
          disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isUnavailable ? (
          <VolumeX className="h-3.5 w-3.5" />
        ) : (
          <Volume2 className="h-3.5 w-3.5" />
        )}
        <span>{label}</span>
      </button>
    );
  }

  // Loaded: full player with scrubber.
  return (
    <div className="flex min-w-[220px] flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04] sm:min-w-[280px]">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void toggle();
        }}
        title={label}
        aria-label={label}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-90"
        style={{ backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="h-3.5 w-3.5 translate-x-[1px] fill-current" />
        )}
      </button>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={handleSeek}
        onClick={(event) => event.stopPropagation()}
        aria-label={t("reading.voice.seek")}
        className="reading-audio-scrubber h-1 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-primary dark:bg-white/15 dark:accent-accent"
        style={{
          background: `linear-gradient(to right, currentColor 0%, currentColor ${
            duration ? (currentTime / duration) * 100 : 0
          }%, transparent ${duration ? (currentTime / duration) * 100 : 0}%)`,
        }}
      />

      <span className="shrink-0 font-mono text-[11px] tabular-nums text-gray-500 dark:text-white/50">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {(isPlaying || isPaused) && <span className="sr-only">{label}</span>}
    </div>
  );
}
