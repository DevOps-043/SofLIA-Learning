import { AnimatePresence, motion } from 'framer-motion';
import { BufferingOverlay } from './BufferingOverlay';
import { CenteredPlayOverlay } from './CenteredPlayOverlay';
import { ControlsOverlay } from './ControlsOverlay';
import { OnboardingVideoElement } from './OnboardingVideoElement';
import { SkipIntroButton } from './SkipIntroButton';
import { VideoErrorOverlay } from './VideoErrorOverlay';
import type { OnboardingVideoController } from './useOnboardingVideoPlayer';

interface OnboardingVideoStageProps {
  isSkippable: boolean;
  labels: {
    loadErrorDescription: string;
    loadErrorTitle: string;
    retry: string;
    skipIntro: string;
    skipToContent: string;
    slowConnection: string;
  };
  onComplete: () => void;
  player: OnboardingVideoController;
  totalVideos: number;
}

export function OnboardingVideoStage({ isSkippable, labels, onComplete, player, totalVideos }: OnboardingVideoStageProps) {
  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-3 sm:p-6"
        exit={player.shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        initial={player.shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      >
        <div
          className="group relative aspect-video max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl"
          onClick={player.handleInteraction}
          onMouseLeave={() => player.isPlaying && player.setShowControls(false)}
          onMouseMove={player.handleInteraction}
          onTouchStart={player.handleInteraction}
        >
          <OnboardingVideoElement player={player} />
          {isSkippable && !player.hasError && <SkipIntroButton label={labels.skipIntro} onSkip={onComplete} />}
          {player.hasError && (
            <VideoErrorOverlay
              onComplete={onComplete}
              onRetry={player.handleRetry}
              retryLabel={labels.retry}
              skipToContentLabel={labels.skipToContent}
              subtitle={labels.loadErrorDescription}
              title={labels.loadErrorTitle}
            />
          )}
          {player.isBuffering && !player.hasError && <BufferingOverlay isSlowConnection={player.isSlowConnection} label={labels.slowConnection} />}
          {!player.hasError && <ControlsOverlay player={player} totalVideos={totalVideos} />}
          {!player.isPlaying && !player.hasError && !player.isBuffering && <CenteredPlayOverlay />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
