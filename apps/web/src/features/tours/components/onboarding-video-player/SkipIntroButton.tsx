import { SkipForward } from 'lucide-react';

interface SkipIntroButtonProps {
  label: string;
  onSkip: () => void;
}

export function SkipIntroButton({ label, onSkip }: SkipIntroButtonProps) {
  return (
    <button
      aria-label={label}
      className="absolute right-2 top-2 z-20 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/75 active:scale-95 sm:right-4 sm:top-4 sm:px-3 sm:text-xs"
      onClick={(event) => {
        event.stopPropagation();
        onSkip();
      }}
      title={label}
      type="button"
    >
      <span>{label}</span>
      <SkipForward className="h-3.5 w-3.5" />
    </button>
  );
}
