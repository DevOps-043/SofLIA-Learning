"use client";

import type { TFunction } from "i18next";
import { Loader2, Square, Volume2, VolumeX } from "lucide-react";
import type { ReadingVoiceStatus } from "./useReadingVoice";

interface ReadingVoiceButtonProps {
  status: ReadingVoiceStatus;
  onClick: () => void;
  t: TFunction<"learn">;
}

function getVoiceLabel(status: ReadingVoiceStatus, t: TFunction<"learn">): string {
  if (status === "loading") return t("reading.voice.generating");
  if (status === "playing") return t("reading.voice.stop");
  if (status === "error") return t("reading.voice.error");
  return t("reading.voice.listen");
}

/**
 * Botón de "escuchar/detener" compartido por las superficies de lectura
 * (actividad, transcripción, resumen). El estado lo provee `useReadingVoice`.
 */
export function ReadingVoiceButton({ status, onClick, t }: ReadingVoiceButtonProps) {
  const label = getVoiceLabel(status, t);
  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const isError = status === "error";
  const isActive = isPlaying || isLoading;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold transition-colors
        ${isError ? "text-red-500 dark:text-red-400" : ""}
        ${isActive ? "bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent" : ""}
        ${!isActive && !isError ? "text-gray-500 hover:bg-gray-200 dark:text-white/40 dark:hover:bg-white/10" : ""}
      `}
    >
      {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      {isPlaying && <Square className="h-3 w-3 fill-current" />}
      {isError && <VolumeX className="h-3 w-3" />}
      {!isLoading && !isPlaying && !isError && <Volume2 className="h-3 w-3" />}
      <span>{label}</span>
    </button>
  );
}
