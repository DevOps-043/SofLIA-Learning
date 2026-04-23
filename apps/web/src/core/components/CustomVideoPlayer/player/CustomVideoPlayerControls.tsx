'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { PlayerBottomControls } from './controls/PlayerBottomControls';
import { PlayerCenterPlayButton } from './controls/PlayerCenterPlayButton';
import { PlayerLoadingOverlay } from './controls/PlayerLoadingOverlay';
import { PlayerSkipControls } from './controls/PlayerSkipControls';
import type { CustomVideoPlayerController } from './types';

interface CustomVideoPlayerControlsProps {
  controller: CustomVideoPlayerController;
}

export function CustomVideoPlayerControls({
  controller,
}: CustomVideoPlayerControlsProps) {
  return (
    <>
      {controller.isLoading && <PlayerLoadingOverlay />}

      {controller.isBuffering && controller.isPlaying && (
        <PlayerLoadingOverlay tone="buffering" />
      )}

      <AnimatePresence>
        {controller.showControls && (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-40 pointer-events-none"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PlayerSkipControls onSkip={controller.skip} />

            {!controller.isPlaying && (
              <PlayerCenterPlayButton onPlay={controller.togglePlay} />
            )}

            <PlayerBottomControls controller={controller} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
