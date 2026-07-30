import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./VideoPanel.module.css";

type VideoNavigationOverlayProps = {
  hasPreviousVideo: boolean;
  hasNextVideo: boolean;
  isLastLesson: boolean;
  finishLabel: string;
  nextLabel: string;
  onNavigatePrevious: () => void;
  onPrimaryAction: () => void | Promise<void>;
  previousLabel: string;
};

export function VideoNavigationOverlay({
  hasPreviousVideo,
  hasNextVideo,
  isLastLesson,
  finishLabel,
  nextLabel,
  onNavigatePrevious,
  onPrimaryAction,
  previousLabel,
}: VideoNavigationOverlayProps) {
  return (
    <div className={styles.navigationOverlay}>
      {hasPreviousVideo && (
        <button
          type="button"
          onClick={onNavigatePrevious}
          className={`${styles.navigationButton} ${styles.navigationPrevious}`}
          aria-label={previousLabel}
          title={previousLabel}
        >
          <ChevronLeft aria-hidden="true" />
          <span className={styles.navigationLabel}>
            {previousLabel}
          </span>
        </button>
      )}

      {(hasNextVideo || isLastLesson) && (
        <button
          type="button"
          onClick={onPrimaryAction}
          className={`${styles.navigationButton} ${styles.navigationNext} ${
            isLastLesson ? styles.navigationFinish : ""
          }`}
          aria-label={isLastLesson ? finishLabel : nextLabel}
          title={isLastLesson ? finishLabel : nextLabel}
        >
          <span className={styles.navigationLabel}>
            {isLastLesson ? finishLabel : nextLabel}
          </span>
          {isLastLesson ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <ChevronRight aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
