import { Pause, Play } from 'lucide-react';
import type { CustomVideoPlayerController } from '../types';
import { PlayerVolumeControl } from './PlayerVolumeControl';

interface PlayerPrimaryControlsProps {
  controller: CustomVideoPlayerController;
}

export function PlayerPrimaryControls({
  controller,
}: PlayerPrimaryControlsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
      <button
        className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void controller.togglePlay();
        }}
        title={controller.isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {controller.isPlaying ? (
          <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
        ) : (
          <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
        )}
      </button>

      <PlayerVolumeControl controller={controller} />

      <div className="text-white text-xs sm:text-sm font-medium tabular-nums">
        {controller.formatTime(controller.currentTime)} /{' '}
        {controller.formatTime(controller.duration)}
      </div>
    </div>
  );
}
