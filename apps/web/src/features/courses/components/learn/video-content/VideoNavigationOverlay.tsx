import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

type VideoNavigationOverlayProps = {
  hasNextVideo: boolean;
  hasPreviousVideo: boolean;
  isLastLesson: boolean;
  onNavigatePrevious: () => void;
  onPrimaryAction: () => void | Promise<void>;
};

export function VideoNavigationOverlay({
  hasNextVideo,
  hasPreviousVideo,
  isLastLesson,
  onNavigatePrevious,
  onPrimaryAction,
}: VideoNavigationOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 sm:px-4">
      {hasPreviousVideo && (
        <button
          className="pointer-events-auto h-10 sm:h-12 rounded-full bg-[#0A2540]/50 hover:bg-[#0A2540]/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-[#0A2540]/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3"
          onClick={onNavigatePrevious}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
          <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
            Anterior
          </span>
        </button>
      )}

      {(hasNextVideo || isLastLesson) && (
        <button
          className={`pointer-events-auto h-10 sm:h-12 rounded-full text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3 ${
            isLastLesson
              ? 'bg-[#0A2540]/55 hover:bg-[#0A2540]/75 border border-[#0A2540]/35 dark:bg-[#00D4B3]/35 dark:hover:bg-[#00D4B3]/55 dark:border-[#00D4B3]/30'
              : 'bg-[#0A2540]/50 hover:bg-[#0A2540]/70 border border-[#0A2540]/30'
          }`}
          onClick={onPrimaryAction}
        >
          <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
            {isLastLesson ? 'Terminar' : 'Siguiente'}
          </span>
          {isLastLesson ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:ml-2 order-2" />
          )}
        </button>
      )}
    </div>
  );
}
