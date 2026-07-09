"use client";

import type { TFunction } from "i18next";
import { Check, Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

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

interface PlaybackSpeedMenuProps {
  changePlaybackRate: (rate: number) => void;
  playbackRate: number;
  playbackRates: readonly number[];
  t: TFunction<"learn">;
}

/**
 * Compact playback-speed selector: shows the current rate (e.g. "1×") and opens a
 * dropdown with the same rate options as the video player.
 */
function PlaybackSpeedMenu({
  changePlaybackRate,
  playbackRate,
  playbackRates,
  t,
}: PlaybackSpeedMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // defaultValue fallbacks guarantee we never render a raw i18n key if the
  // bundled learn namespace is stale (e.g. dev server not restarted).
  const speedLabel = t("reading.voice.speed", "Velocidad de reproducción");
  const normalLabel = t("reading.voice.speedNormal", "Normal");

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title={speedLabel}
        aria-label={speedLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums transition-colors ${
          isOpen
            ? "border-gray-300 bg-gray-100 text-gray-700 dark:border-white/20 dark:bg-white/10 dark:text-white/80"
            : "border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white/80"
        }`}
      >
        {playbackRate}×
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={speedLabel}
          className="absolute right-0 top-full z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-white/10 dark:bg-gray-800"
        >
          <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white/40">
            {speedLabel}
          </p>
          {playbackRates.map((rate) => {
            const isSelected = rate === playbackRate;
            return (
              <button
                key={rate}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={(event) => {
                  event.stopPropagation();
                  changePlaybackRate(rate);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs tabular-nums transition-colors hover:bg-gray-100 dark:hover:bg-white/10 ${
                  isSelected
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-white/60"
                }`}
              >
                <span className="whitespace-nowrap">
                  {rate === 1 ? normalLabel : `${rate}×`}
                </span>
                {isSelected && (
                  <Check
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: "var(--learn-action)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Inline reading-audio player: a play/pause control plus a draggable progress bar so
 * the user can scrub to any position. Streams the pre-generated MP3 from storage.
 */
export function ReadingAudioPlayer({ player, t }: ReadingAudioPlayerProps) {
  const { changePlaybackRate, currentTime, duration, playbackRate, playbackRates, seek, status, toggle } = player;

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

      <PlaybackSpeedMenu
        changePlaybackRate={changePlaybackRate}
        playbackRate={playbackRate}
        playbackRates={playbackRates}
        t={t}
      />

      {(isPlaying || isPaused) && <span className="sr-only">{label}</span>}
    </div>
  );
}
