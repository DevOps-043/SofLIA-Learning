import { useEffect, useState } from 'react';
import { Pause, Play, Settings, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatVideoTime } from './time';
import type { OnboardingVideoController } from './useOnboardingVideoPlayer';

interface ControlsOverlayProps {
  player: OnboardingVideoController;
  totalVideos: number;
}

export function ControlsOverlay({ player, totalVideos }: ControlsOverlayProps) {
  const { t } = useTranslation('common');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const visible = player.showControls || !player.isPlaying || player.isBuffering;

  // El selector de calidad solo aplica cuando la fuente es HLS y la
  // reproducimos via MSE (hls.js). En HLS nativo (Safari/iOS) el SO
  // controla el bitrate y no exponemos una API para forzar resolucion,
  // por lo que ocultamos el control para no mentirle al usuario.
  const canSelectQuality =
    player.quality.isHls &&
    !player.quality.isNativeHls &&
    player.quality.availableRenditions.length > 0;

  // Cierra el menu cuando los controles se ocultan para no dejar UI huerfana.
  useEffect(() => {
    if (!visible) setShowQualityMenu(false);
  }, [visible]);

  return (
    <div className={`pointer-events-none absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <TopBar currentIndex={player.currentVideoIndex} totalVideos={totalVideos} />
      <div className="pointer-events-auto px-4 pb-4 pt-10" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
        <ProgressBar onSeek={player.handleSeek} progress={player.progress} />
        <div className="flex items-center justify-between gap-3">
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
          {canSelectQuality && (
            <QualitySelector
              labelAdaptive={t('media.introPlayer.qualityAdaptive')}
              labelAuto={t('media.introPlayer.qualityAuto')}
              labelQuality={t('media.introPlayer.quality')}
              onToggle={() => setShowQualityMenu((current) => !current)}
              open={showQualityMenu}
              quality={player.quality}
            />
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

interface QualitySelectorProps {
  labelAdaptive: string;
  labelAuto: string;
  labelQuality: string;
  onToggle: () => void;
  open: boolean;
  quality: OnboardingVideoController['quality'];
}

function QualitySelector({ labelAdaptive, labelAuto, labelQuality, onToggle, open, quality }: QualitySelectorProps) {
  const activeLabel = quality.selectedHeight === null ? labelAuto : `${quality.selectedHeight}p`;

  return (
    <div className="relative">
      <button
        aria-label={labelQuality}
        className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-white transition-all hover:bg-white/15 active:scale-95"
        onClick={(event) => { event.stopPropagation(); onToggle(); }}
        type="button"
      >
        <Settings className="h-4 w-4" />
        <span className="select-none text-[11px] font-medium tabular-nums">{activeLabel}</span>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-lg border border-white/10 bg-black/90 shadow-xl backdrop-blur-md">
          <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-white/50">
            {labelQuality}
          </div>
          <button
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${quality.selectedHeight === null ? 'bg-white/15 font-medium text-white' : 'text-white/80 hover:bg-white/10'}`}
            onClick={(event) => { event.stopPropagation(); quality.setQualityLevel(null); }}
            type="button"
          >
            <span>{labelAuto}</span>
            <span className="text-[10px] text-white/40">{labelAdaptive}</span>
          </button>
          {quality.availableRenditions.map((rendition) => (
            <button
              key={rendition.height}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors ${quality.selectedHeight === rendition.height ? 'bg-white/15 font-medium text-white' : 'text-white/80 hover:bg-white/10'}`}
              onClick={(event) => { event.stopPropagation(); quality.setQualityLevel(rendition.height); }}
              type="button"
            >
              {rendition.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
