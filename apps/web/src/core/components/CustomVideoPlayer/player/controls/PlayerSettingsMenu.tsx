import { AnimatePresence, motion } from 'framer-motion';
import { PictureInPicture, Settings } from 'lucide-react';
import type { CustomVideoPlayerController } from '../types';

interface PlayerSettingsMenuProps {
  controller: CustomVideoPlayerController;
}

export function PlayerSettingsMenu({ controller }: PlayerSettingsMenuProps) {
  return (
    <div className="relative">
      <button
        className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
        onClick={() => controller.setShowSettings((current) => !current)}
        title="Configuracion"
      >
        <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
      </button>

      <AnimatePresence>
        {controller.showSettings && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-full right-0 mb-2 w-40 sm:w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 overflow-hidden"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
          >
            <div className="p-2 border-b border-white/10">
              <div className="px-3 py-2 text-xs font-medium text-white/70 uppercase tracking-wider">
                Velocidad de reproduccion
              </div>
              <div className="space-y-1">
                {controller.playbackRates.map((rate) => (
                  <button
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                      controller.playbackRate === rate
                        ? 'bg-[#00D4B3]/20 text-[#00D4B3] font-medium'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                    key={rate}
                    onClick={() => controller.changePlaybackRate(rate)}
                  >
                    {rate === 1 ? 'Normal' : `${rate}x`}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all duration-200 flex items-center gap-2"
              onClick={() => {
                void controller.togglePictureInPicture();
              }}
            >
              <PictureInPicture className="w-4 h-4" />
              Imagen en imagen
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
