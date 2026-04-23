import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import type { CustomVideoPlayerController } from '../types';

interface PlayerVolumeControlProps {
  controller: CustomVideoPlayerController;
}

export function PlayerVolumeControl({ controller }: PlayerVolumeControlProps) {
  const isSilent = controller.isMuted || controller.volume === 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => controller.setShowVolumeControl(true)}
      onMouseLeave={() => controller.setShowVolumeControl(false)}
    >
      <button
        className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          controller.toggleMute();
        }}
        title={isSilent ? 'Activar sonido' : 'Silenciar'}
      >
        {isSilent ? (
          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
        ) : (
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
        )}
      </button>

      <AnimatePresence>
        {controller.showVolumeControl && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/80 backdrop-blur-md rounded-lg"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
          >
            <div
              className="w-2 h-20 bg-white/20 rounded-full cursor-pointer relative"
              onClick={controller.handleVolumeClick}
              onMouseDown={controller.handleVolumeMouseDown}
              onMouseLeave={controller.handleVolumeMouseUp}
              onMouseMove={controller.handleVolumeMouseMove}
              onMouseUp={controller.handleVolumeMouseUp}
              onTouchEnd={controller.handleVolumeTouchEnd}
              onTouchMove={controller.handleVolumeTouchMove}
              onTouchStart={controller.handleVolumeTouchStart}
              ref={controller.volumeBarRef}
              style={{ userSelect: 'none' }}
            >
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#00D4B3] to-[#00b89a] rounded-full"
                initial={false}
                style={{ height: `${(controller.isMuted ? 0 : controller.volume) * 100}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
