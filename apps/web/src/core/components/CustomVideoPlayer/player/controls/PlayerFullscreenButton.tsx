import { Maximize, Minimize } from 'lucide-react';
import type { CustomVideoPlayerController } from '../types';

interface PlayerFullscreenButtonProps {
  controller: CustomVideoPlayerController;
}

export function PlayerFullscreenButton({
  controller,
}: PlayerFullscreenButtonProps) {
  return (
    <button
      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void controller.toggleFullscreen();
      }}
      title={controller.isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
    >
      {controller.isFullscreen ? (
        <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
      ) : (
        <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
}
