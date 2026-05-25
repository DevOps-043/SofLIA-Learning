import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

type VideoNavigationOverlayProps = {
  hasPreviousVideo: boolean;
  hasNextVideo: boolean;
  isLastLesson: boolean;
  finishLabel: string;
  nextLabel: string;
  onNavigatePrevious: () => void;
  onPrimaryAction: () => void | Promise<void>;
  previousLabel: string;
};

export function VideoNavigationOverlay({
  hasPreviousVideo,
  hasNextVideo,
  isLastLesson,
  finishLabel,
  nextLabel,
  onNavigatePrevious,
  onPrimaryAction,
  previousLabel,
}: VideoNavigationOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2 sm:px-4">
      {hasPreviousVideo && (
        <button
          onClick={onNavigatePrevious}
          className="pointer-events-auto h-10 sm:h-12 rounded-full bg-primary/50 hover:bg-primary/70 text-white flex items-center justify-center hover:justify-start overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm border border-primary/30 group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 group-hover:mr-2" />
          <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden">
            {previousLabel}
          </span>
        </button>
      )}

      {(hasNextVideo || isLastLesson) && (
        <button
          onClick={onPrimaryAction}
          className={`pointer-events-auto h-10 sm:h-12 rounded-full text-white flex items-center justify-center hover:justify-end overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm group w-10 sm:w-12 md:hover:w-32 hover:pl-2 md:hover:pl-3 hover:pr-2 md:hover:pr-3 ${
            isLastLesson
              ? "bg-primary/55 hover:bg-primary/75 border border-primary/35 dark:bg-accent/35 dark:hover:bg-accent/55 dark:border-accent/30"
              : "bg-primary/50 hover:bg-primary/70 border border-primary/30"
          }`}
        >
          <span className="hidden md:block text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-0 group-hover:w-auto overflow-hidden order-1">
            {isLastLesson ? finishLabel : nextLabel}
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
