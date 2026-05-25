import { VolumeX } from 'lucide-react';

interface VideoErrorOverlayProps {
  onComplete: () => void;
  onRetry: () => void;
  retryLabel: string;
  skipToContentLabel: string;
  subtitle: string;
  title: string;
}

export function VideoErrorOverlay({ onComplete, onRetry, retryLabel, skipToContentLabel, subtitle, title }: VideoErrorOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 p-6 text-center text-white">
      <div className="mb-4 rounded-full bg-red-500/20 p-4">
        <VolumeX className="h-12 w-12 text-red-400" />
      </div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="mb-6 max-w-md text-white/60">{subtitle}</p>
      <div className="pointer-events-auto flex gap-4">
        <button className="rounded-full border border-white/20 bg-white/10 px-6 py-2 transition-all hover:bg-white/20" onClick={(event) => { event.stopPropagation(); onRetry(); }} type="button">
          {retryLabel}
        </button>
        <button className="rounded-full bg-white px-6 py-2 font-bold text-black transition-all hover:bg-gray-200" onClick={(event) => { event.stopPropagation(); onComplete(); }} type="button">
          {skipToContentLabel}
        </button>
      </div>
    </div>
  );
}
