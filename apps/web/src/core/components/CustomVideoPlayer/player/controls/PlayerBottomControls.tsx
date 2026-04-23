import type { CustomVideoPlayerController } from '../types';
import { PlayerFullscreenButton } from './PlayerFullscreenButton';
import { PlayerPrimaryControls } from './PlayerPrimaryControls';
import { PlayerProgressBar } from './PlayerProgressBar';
import { PlayerSettingsMenu } from './PlayerSettingsMenu';

interface PlayerBottomControlsProps {
  controller: CustomVideoPlayerController;
}

export function PlayerBottomControls({
  controller,
}: PlayerBottomControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 pointer-events-auto">
      <PlayerProgressBar controller={controller} />

      <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
        <PlayerPrimaryControls controller={controller} />

        <div className="flex items-center gap-1 sm:gap-2">
          <PlayerSettingsMenu controller={controller} />
          <PlayerFullscreenButton controller={controller} />
        </div>
      </div>
    </div>
  );
}
