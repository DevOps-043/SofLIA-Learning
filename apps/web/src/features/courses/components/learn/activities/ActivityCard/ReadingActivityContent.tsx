import type React from 'react';
import type { TFunction } from 'i18next';
import { ZoomIn } from 'lucide-react';
import { FormattedContentRenderer } from '../../ContentRenderers';
import type { LearnActivity } from '../../types';
import { ReadingVoiceButton } from '../../reading-voice/ReadingVoiceButton';
import { useReadingVoice } from '../../reading-voice/useReadingVoice';

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
  const { status, activeSegmentIndex, speak } = useReadingVoice();
  const isPlaying = status === 'playing';

  return (
    <>
      <div className="mb-2 flex items-center justify-end gap-1.5">
        <ReadingVoiceButton status={status} t={t} onClick={() => speak(activity.activity_content)} />
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
          activeSegmentIndex={activeSegmentIndex}
          isPlaying={isPlaying}
        />
      </div>
    </>
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
