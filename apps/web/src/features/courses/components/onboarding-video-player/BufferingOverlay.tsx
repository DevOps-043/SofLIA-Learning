import { Wifi } from 'lucide-react';

export function BufferingOverlay({ isSlowConnection, label }: { isSlowConnection: boolean; label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" data-video-buffering-indicator="true">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white sm:h-16 sm:w-16" />
      {isSlowConnection && (
        <div className="mt-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2">
          <Wifi className="h-4 w-4 text-yellow-400" />
          <span className="text-sm text-white/80">{label}</span>
        </div>
      )}
    </div>
  );
}
