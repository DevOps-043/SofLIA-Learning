import { motion } from 'framer-motion';
import type { CustomVideoPlayerController } from '../types';

interface PlayerProgressBarProps {
  controller: CustomVideoPlayerController;
}

export function PlayerProgressBar({ controller }: PlayerProgressBarProps) {
  const progress =
    controller.duration > 0
      ? (controller.currentTime / controller.duration) * 100
      : 0;

  return (
    <div
      className={`w-full h-1 sm:h-1.5 bg-white/20 rounded-full mb-2 sm:mb-3 md:mb-4 cursor-pointer group/progress hover:h-2 transition-all duration-200 ${
        controller.isDraggingProgress ? 'h-2' : ''
      }`}
      onClick={controller.handleProgressClick}
      onMouseDown={controller.handleProgressMouseDown}
      onMouseLeave={controller.handleProgressMouseUp}
      onMouseMove={controller.handleProgressMouseMove}
      onMouseUp={controller.handleProgressMouseUp}
      onTouchEnd={controller.handleProgressTouchEnd}
      onTouchMove={controller.handleProgressTouchMove}
      onTouchStart={controller.handleProgressTouchStart}
      ref={controller.progressBarRef}
      style={{ userSelect: 'none' }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-[#00D4B3] to-[#00b89a] rounded-full relative"
        initial={false}
        style={{ width: `${progress}%` }}
      >
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-opacity shadow-lg ${
            controller.isDraggingProgress || controller.isHovering
              ? 'opacity-100'
              : 'opacity-0 group-hover/progress:opacity-100'
          }`}
        />
      </motion.div>
    </div>
  );
}
