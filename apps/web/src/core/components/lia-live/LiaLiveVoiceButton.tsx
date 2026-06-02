'use client';

import { Loader2, Mic, Square } from 'lucide-react';
import { useLiaLiveVoice } from './useLiaLiveVoice';

interface LiaLiveVoiceButtonProps {
  className?: string;
}

/**
 * Botón opt-in de conversación de voz en vivo con SofLIA (Gemini Live).
 * El usuario lo activa/desactiva; gestiona su propia sesión (mic + audio).
 * Si la voz en vivo no está disponible, muestra el estado de error y no afecta
 * al chat de texto ni al TTS existente.
 */
export function LiaLiveVoiceButton({ className = '' }: LiaLiveVoiceButtonProps) {
  const { status, error, isLive, toggle } = useLiaLiveVoice();

  const label =
    status === 'connecting'
      ? 'Conectando…'
      : isLive
        ? 'En vivo · toca para terminar'
        : status === 'error'
          ? 'No disponible · reintentar'
          : 'Hablar con SofLIA';

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => { void toggle(); }}
        aria-label={label}
        title={label}
        aria-pressed={isLive}
        className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors
          ${isLive
            ? 'bg-accent text-white shadow-md shadow-accent/30'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15'}
        `}
      >
        {status === 'connecting' && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLive && <Square className="h-4 w-4 fill-current" />}
        {!isLive && status !== 'connecting' && <Mic className="h-4 w-4" />}
        <span>{label}</span>
        {isLive && (
          <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
        )}
      </button>
      {status === 'error' && error && (
        <span className="px-1 text-[11px] text-red-500 dark:text-red-400">
          {error === 'LIVE_PROVIDER_UNAVAILABLE'
            ? 'La voz en vivo no está configurada.'
            : 'No se pudo iniciar la voz en vivo.'}
        </span>
      )}
    </div>
  );
}
