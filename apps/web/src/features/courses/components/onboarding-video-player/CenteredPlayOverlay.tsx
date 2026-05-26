import { Play } from 'lucide-react';

export function CenteredPlayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur-sm sm:h-16 sm:w-16">
        <Play className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7" />
      </div>
    </div>
  );
}
