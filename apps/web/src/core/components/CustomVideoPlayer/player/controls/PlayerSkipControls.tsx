import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PlayerSkipControlsProps {
  onSkip: (seconds: number) => void;
}

export function PlayerSkipControls({ onSkip }: PlayerSkipControlsProps) {
  return (
    <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
      <button
        className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn"
        onClick={() => onSkip(-10)}
        title="Retroceder 10s"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:scale-110 transition-transform" />
        <span className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-white bg-black/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
          10s
        </span>
      </button>
      <button
        className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn"
        onClick={() => onSkip(10)}
        title="Avanzar 10s"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:scale-110 transition-transform" />
        <span className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-white bg-black/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
          10s
        </span>
      </button>
    </div>
  );
}
