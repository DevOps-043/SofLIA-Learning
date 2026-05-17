import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { formatVideoTime } from './time';
import type { OnboardingVideoController } from './useOnboardingVideoPlayer';

interface ControlsOverlayProps {
  player: OnboardingVideoController;
  totalVideos: number;
}

export function ControlsOverlay({ player, totalVideos }: ControlsOverlayProps) {
  const visible = player.showControls || !player.isPlaying || player.isBuffering;

  return (
    <div className={`pointer-events-none absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <TopBar currentIndex={player.currentVideoIndex} totalVideos={totalVideos} />
      <div className="pointer-events-auto px-4 pb-4 pt-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
        <ProgressBar onSeek={player.handleSeek} progress={player.progress} />
        <div className="flex items-center gap-3">
          <button className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:bg-white/15 active:scale-95" onClick={(event) => { event.stopPropagation(); player.togglePlay(); }} type="button">
            {player.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-all hover:bg-white/15 active:scale-95" onClick={(event) => { event.stopPropagation(); player.toggleMute(); }} type="button">
            {player.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {player.duration > 0 && (
            <span className="ml-0.5 select-none text-[11px] tabular-nums text-white/60">
              {formatVideoTime(player.currentTime)} / {formatVideoTime(player.duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TopBar({ currentIndex, totalVideos }: { currentIndex: number; totalVideos: number }) {
  return (
    <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 pb-10 pt-4" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
      {totalVideos > 1 && (
        <div className="flex items-center gap-1.5">
          {[...Array(totalVideos)].map((_, index) => (
            <div
              key={index}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: index === currentIndex ? 20 : 6,
                backgroundColor: index === currentIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
              }}
            />
          ))}
          <span className="ml-1 text-[11px] text-white/60">{currentIndex + 1} / {totalVideos}</span>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ onSeek, progress }: { onSeek: OnboardingVideoController['handleSeek']; progress: number }) {
  return (
    <div className="group/progress mb-3 h-1 w-full cursor-pointer rounded-full" onClick={(event) => { event.stopPropagation(); onSeek(event); }} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
      <div className="relative h-full rounded-full transition-all duration-150 group-hover/progress:scale-y-150" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))', transformOrigin: 'bottom' }}>
        <div className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover/progress:opacity-100" />
      </div>
    </div>
  );
}
