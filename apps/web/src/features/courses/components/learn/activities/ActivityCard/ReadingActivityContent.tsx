import type React from 'react';
import type { TFunction } from 'i18next';
import { ZoomIn } from 'lucide-react';
import { FormattedContentRenderer } from '../../ContentRenderers';
import type { LearnActivity } from '../../types';
import { ReadingAudioPlayer } from '../../reading-voice/ReadingAudioPlayer';
import { useReadingAudioPlayer } from '../../reading-voice/useReadingAudioPlayer';
import styles from '../../ActivitiesExperience.module.css';

interface ReadingActivityContentProps {
  activity: LearnActivity;
  canZoomIn: boolean;
  canZoomOut: boolean;
  contentZoom: number;
  lessonId: string;
  slug: string;
  t: TFunction<'learn'>;
  zoomIn: () => void;
  zoomOut: () => void;
}

export function ReadingActivityContent({
  activity,
  canZoomIn,
  canZoomOut,
  contentZoom,
  lessonId,
  slug,
  t,
  zoomIn,
  zoomOut
}: ReadingActivityContentProps) {
  const canListen = activity.activity_type === 'reflection';
  const player = useReadingAudioPlayer(
    canListen
      ? {
          lessonId,
          slug,
          sourceId: activity.activity_id,
          sourceType: 'activity_reading',
        }
      : null,
  );

  return (
    <div className={styles.readingSurface}>
      <div className={styles.readingToolbar}>
        {canListen ? (
          <>
            <ReadingAudioPlayer player={player} t={t} />
            <div className={styles.readingToolbarDivider} />
          </>
        ) : null}
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
          currentTime={player.currentTime}
          duration={player.duration}
          isAudioActive={player.status === 'playing' || player.status === 'paused'}
          presentation="editorial"
        />
      </div>
    </div>
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
      className={styles.zoomButton}
    >
      {children}
    </button>
  );
}
