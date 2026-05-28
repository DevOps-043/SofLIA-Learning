import type React from 'react';
import type { TFunction } from 'i18next';
import { Loader2, Square, Volume2, VolumeX, ZoomIn } from 'lucide-react';
import { FormattedContentRenderer } from '../../ContentRenderers';
import type { LearnActivity } from '../../types';
import { useActivityVoice, type ActivityVoiceStatus } from './useActivityVoice';

interface ReadingActivityContentProps {
  activity: LearnActivity;
  canZoomIn: boolean;
  canZoomOut: boolean;
  contentZoom: number;
  t: TFunction<'learn'>;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function ReadingActivityContent({
  activity,
  canZoomIn,
  canZoomOut,
  contentZoom,
  t,
  zoomIn,
  zoomOut
}: ReadingActivityContentProps) {
  const { status, playbackProgress, speak } = useActivityVoice();
  const isPlaying = status === 'playing';

  return (
    <>
      <div className="mb-2 flex items-center justify-end gap-1.5">
        <VoiceButton
          status={status}
          label={getVoiceLabel(status, t)}
          onClick={() => speak(activity.activity_content)}
        />
        <div className="h-3 w-px bg-gray-200 dark:bg-white/10" />
        <ZoomIn className="h-3.5 w-3.5 text-gray-400 dark:text-white/30" />
        <ZoomButton disabled={!canZoomOut} label={t('reading.decreaseFontSize')} onClick={zoomOut}>
          A-
        </ZoomButton>
        <ZoomButton disabled={!canZoomIn} label={t('reading.increaseFontSize')} onClick={zoomIn}>
          A+
        </ZoomButton>
      </div>
      <div style={{ zoom: contentZoom }}>
        <FormattedContentRenderer
          content={activity.activity_content}
          activityId={activity.activity_id}
          playbackProgress={playbackProgress}
          isPlaying={isPlaying}
        />
      </div>
    </>
  );
}

function getVoiceLabel(status: ActivityVoiceStatus, t: TFunction<'learn'>): string {
  if (status === 'loading') return t('reading.voice.generating');
  if (status === 'playing') return t('reading.voice.stop');
  if (status === 'error') return t('reading.voice.error');
  return t('reading.voice.listen');
}

function VoiceButton({
  label,
  onClick,
  status,
}: {
  label: string;
  onClick: () => void;
  status: ActivityVoiceStatus;
}) {
  const isLoading = status === 'loading';
  const isPlaying = status === 'playing';
  const isError = status === 'error';
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
        ${isError ? 'text-red-500 dark:text-red-400' : ''}
        ${isActive ? 'bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent' : ''}
        ${!isActive && !isError ? 'text-gray-500 hover:bg-gray-200 dark:text-white/40 dark:hover:bg-white/10' : ''}
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

function ZoomButton({
  children,
  disabled,
  label,
  onClick
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rounded px-1.5 py-0.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10"
    >
      {children}
    </button>
  );
}
