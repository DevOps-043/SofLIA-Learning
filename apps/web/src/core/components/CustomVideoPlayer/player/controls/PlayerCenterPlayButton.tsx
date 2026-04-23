import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface PlayerCenterPlayButtonProps {
  onPlay: () => Promise<void>;
}

export function PlayerCenterPlayButton({ onPlay }: PlayerCenterPlayButtonProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <motion.button
        animate={{ opacity: 1, scale: 1 }}
        className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto group"
        exit={{ opacity: 0, scale: 0.8 }}
        initial={{ opacity: 0, scale: 0.8 }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void onPlay();
        }}
      >
        <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white group-hover:scale-110 transition-transform ml-0.5" />
      </motion.button>
    </div>
  );
}
