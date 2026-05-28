'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Settings,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CustomVideoPlayerController } from './types';

type SettingsPanel = 'main' | 'quality' | 'speed';

interface CustomVideoPlayerControlsProps {
  controller: CustomVideoPlayerController;
}

export function CustomVideoPlayerControls({
  controller,
}: CustomVideoPlayerControlsProps) {
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>('main');

  // Reset to main panel whenever the dropdown closes
  useEffect(() => {
    if (!controller.showSettings) {
      setSettingsPanel('main');
    }
  }, [controller.showSettings]);

  const speedLabel =
    controller.playbackRate === 1 ? 'Normal' : `${controller.playbackRate}×`;

  const qualityLabel =
    controller.quality.selectedHeight === null
      ? 'Auto'
      : `${controller.quality.selectedHeight}p`;

  const hasQualitySelector =
    controller.quality.isHls &&
    !controller.quality.isNativeHls &&
    controller.quality.availableRenditions.length > 0;

  return (
    <>
      {controller.isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-carbon-900/80 backdrop-blur-sm z-30"
          data-video-loading-indicator="true"
        >
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      {controller.isBuffering && controller.isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-carbon-900/50 z-20"
          data-video-buffering-indicator="true"
        >
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
      )}

      <AnimatePresence>
        {controller.showControls && (
          <motion.div
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-40 pointer-events-none"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
              <button
                className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn"
                onClick={() => controller.skip(-10)}
                title="Retroceder 10s"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-white bg-black/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                  10s
                </span>
              </button>
              <button
                className="p-1.5 sm:p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-lg transition-all duration-200 group/btn disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-black/60"
                disabled={controller.isSeekingLocked}
                onClick={() => controller.skip(10)}
                title="Avanzar 10s"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover/btn:scale-110 transition-transform" />
                <span className="absolute -bottom-7 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-white bg-black/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap">
                  10s
                </span>
              </button>
            </div>

            {!controller.isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <motion.button
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto group"
                  exit={{ opacity: 0, scale: 0.8 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void controller.togglePlay();
                  }}
                >
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white group-hover:scale-110 transition-transform ml-0.5" />
                </motion.button>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 pointer-events-auto">
              <div
                className={`w-full h-1 sm:h-1.5 bg-white/20 rounded-full mb-2 sm:mb-3 md:mb-4 group/progress transition-all duration-200 ${
                  controller.isDraggingProgress ? 'h-2' : ''
                } ${
                  controller.isSeekingLocked
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:h-2'
                }`}
                onClick={controller.handleProgressClick}
                onMouseDown={controller.handleProgressMouseDown}
                onMouseLeave={controller.handleProgressMouseUp}
                onMouseMove={controller.handleProgressMouseMove}
                onMouseUp={controller.handleProgressMouseUp}
                onTouchEnd={controller.handleProgressTouchEnd}
                onTouchMove={controller.handleProgressTouchMove}
                onTouchStart={controller.handleProgressTouchStart}
                data-seek-locked={controller.isSeekingLocked}
                data-video-progress-bar="true"
                ref={controller.progressBarRef}
                style={{ userSelect: 'none' }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent rounded-full relative"
                  initial={false}
                  style={{
                    width: `${
                      controller.duration > 0
                        ? (controller.currentTime / controller.duration) * 100
                        : 0
                    }%`,
                  }}
                >
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full transition-opacity shadow-lg ${
                      controller.isDraggingProgress || controller.isHovering
                        ? 'opacity-100'
                        : 'opacity-0 group-hover/progress:opacity-100'
                    }`}
                  />
                </motion.div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                  <button
                    className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void controller.togglePlay();
                    }}
                    title={controller.isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {controller.isPlaying ? (
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </button>

                  <div
                    className="relative"
                    onMouseEnter={() => controller.setShowVolumeControl(true)}
                    onMouseLeave={() => controller.setShowVolumeControl(false)}
                  >
                    <button
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        controller.toggleMute();
                      }}
                      title={controller.isMuted ? 'Activar sonido' : 'Silenciar'}
                    >
                      {controller.isMuted || controller.volume === 0 ? (
                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                      ) : (
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                      )}
                    </button>

                    <AnimatePresence>
                      {controller.showVolumeControl && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black/80 backdrop-blur-md rounded-lg"
                          exit={{ opacity: 0, y: 10 }}
                          initial={{ opacity: 0, y: 10 }}
                        >
                          <div
                            className="w-2 h-20 bg-white/20 rounded-full cursor-pointer relative"
                            onClick={controller.handleVolumeClick}
                            onMouseDown={controller.handleVolumeMouseDown}
                            onMouseLeave={controller.handleVolumeMouseUp}
                            onMouseMove={controller.handleVolumeMouseMove}
                            onMouseUp={controller.handleVolumeMouseUp}
                            onTouchEnd={controller.handleVolumeTouchEnd}
                            onTouchMove={controller.handleVolumeTouchMove}
                            onTouchStart={controller.handleVolumeTouchStart}
                            ref={controller.volumeBarRef}
                            style={{ userSelect: 'none' }}
                          >
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-accent to-accent rounded-full"
                              initial={false}
                              style={{
                                height: `${(controller.isMuted ? 0 : controller.volume) * 100}%`,
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="text-white text-xs sm:text-sm font-medium tabular-nums">
                    {controller.formatTime(controller.currentTime)} /{' '}
                    {controller.formatTime(controller.duration)}
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Settings */}
                  <div className="relative">
                    <button
                      className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                      onClick={() =>
                        controller.setShowSettings((current) => !current)
                      }
                      title="Configuración"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    </button>

                    <AnimatePresence>
                      {controller.showSettings && (
                        <motion.div
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className="absolute bottom-full right-0 mb-2 w-56 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.85)] border border-white/[0.07]"
                          exit={{ opacity: 0, scale: 0.97, y: 4 }}
                          initial={{ opacity: 0, scale: 0.97, y: 4 }}
                          style={{ background: '#212121' }}
                          transition={{ duration: 0.12 }}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {settingsPanel === 'main' && (
                              <motion.div
                                key="main"
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                initial={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.1 }}
                                className="py-1"
                              >
                                {/* Playback speed */}
                                <button
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors duration-100"
                                  onClick={() => setSettingsPanel('speed')}
                                >
                                  <Gauge className="w-4 h-4 text-white/50 flex-shrink-0" />
                                  <span className="text-[13px] text-white flex-1 text-left">
                                    Velocidad
                                  </span>
                                  <span className="text-[12px] text-white/40 mr-1">
                                    {speedLabel}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                </button>

                                {/* Quality (HLS only) */}
                                {hasQualitySelector && (
                                  <button
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors duration-100"
                                    onClick={() => setSettingsPanel('quality')}
                                  >
                                    <Sliders className="w-4 h-4 text-white/50 flex-shrink-0" />
                                    <span className="text-[13px] text-white flex-1 text-left">
                                      Calidad
                                    </span>
                                    <span className="text-[12px] text-white/40 mr-1">
                                      {qualityLabel}
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                  </button>
                                )}

                                {/* Divider before PiP */}
                                <div className="mx-4 my-1 border-t border-white/[0.06]" />

                                {/* Picture in Picture */}
                                <button
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors duration-100"
                                  onClick={() => {
                                    void controller.togglePictureInPicture();
                                  }}
                                >
                                  <PictureInPicture2 className="w-4 h-4 text-white/50 flex-shrink-0" />
                                  <span className="text-[13px] text-white flex-1 text-left">
                                    Imagen en imagen
                                  </span>
                                </button>
                              </motion.div>
                            )}

                            {settingsPanel === 'speed' && (
                              <motion.div
                                key="speed"
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                initial={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.1 }}
                              >
                                {/* Subpanel header */}
                                <div className="flex items-center gap-1 px-2 py-2 border-b border-white/[0.07]">
                                  <button
                                    className="p-1.5 rounded-lg hover:bg-white/[0.07] transition-colors"
                                    onClick={() => setSettingsPanel('main')}
                                  >
                                    <ChevronLeft className="w-4 h-4 text-white" />
                                  </button>
                                  <span className="text-[13px] font-medium text-white">
                                    Velocidad de reproducción
                                  </span>
                                </div>

                                <div className="py-1">
                                  {controller.playbackRates.map((rate) => (
                                    <button
                                      key={rate}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors duration-100"
                                      onClick={() => {
                                        controller.changePlaybackRate(rate);
                                        setSettingsPanel('main');
                                      }}
                                    >
                                      <Check
                                        className={`w-4 h-4 flex-shrink-0 transition-opacity ${
                                          controller.playbackRate === rate
                                            ? 'text-[var(--color-accent)] opacity-100'
                                            : 'opacity-0'
                                        }`}
                                      />
                                      <span
                                        className={`text-[13px] ${
                                          controller.playbackRate === rate
                                            ? 'text-[var(--color-accent)] font-medium'
                                            : 'text-white/80'
                                        }`}
                                      >
                                        {rate === 1 ? 'Normal' : `${rate}×`}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {settingsPanel === 'quality' && (
                              <motion.div
                                key="quality"
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                initial={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.1 }}
                              >
                                {/* Subpanel header */}
                                <div className="flex items-center gap-1 px-2 py-2 border-b border-white/[0.07]">
                                  <button
                                    className="p-1.5 rounded-lg hover:bg-white/[0.07] transition-colors"
                                    onClick={() => setSettingsPanel('main')}
                                  >
                                    <ChevronLeft className="w-4 h-4 text-white" />
                                  </button>
                                  <span className="text-[13px] font-medium text-white">
                                    Calidad
                                  </span>
                                </div>

                                <div className="py-1">
                                  {/* Auto */}
                                  <button
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors duration-100"
                                    onClick={() => {
                                      controller.quality.setQualityLevel(null);
                                      setSettingsPanel('main');
                                    }}
                                  >
                                    <Check
                                      className={`w-4 h-4 flex-shrink-0 transition-opacity ${
                                        controller.quality.selectedHeight === null
                                          ? 'text-[var(--color-accent)] opacity-100'
                                          : 'opacity-0'
                                      }`}
                                    />
                                    <span
                                      className={`text-[13px] flex-1 text-left ${
                                        controller.quality.selectedHeight === null
                                          ? 'text-[var(--color-accent)] font-medium'
                                          : 'text-white/80'
                                      }`}
                                    >
                                      Auto
                                    </span>
                                    <span className="text-[11px] text-white/25">
                                      adaptativo
                                    </span>
                                  </button>

                                  {/* Renditions */}
                                  {controller.quality.availableRenditions.map(
                                    (rendition) => (
                                      <button
                                        key={rendition.height}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors duration-100"
                                        onClick={() => {
                                          controller.quality.setQualityLevel(
                                            rendition.height,
                                          );
                                          setSettingsPanel('main');
                                        }}
                                      >
                                        <Check
                                          className={`w-4 h-4 flex-shrink-0 transition-opacity ${
                                            controller.quality.selectedHeight ===
                                            rendition.height
                                              ? 'text-[var(--color-accent)] opacity-100'
                                              : 'opacity-0'
                                          }`}
                                        />
                                        <span
                                          className={`text-[13px] ${
                                            controller.quality.selectedHeight ===
                                            rendition.height
                                              ? 'text-[var(--color-accent)] font-medium'
                                              : 'text-white/80'
                                          }`}
                                        >
                                          {rendition.label}
                                        </span>
                                      </button>
                                    ),
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void controller.toggleFullscreen();
                    }}
                    title={
                      controller.isFullscreen
                        ? 'Salir de pantalla completa'
                        : 'Pantalla completa'
                    }
                  >
                    {controller.isFullscreen ? (
                      <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    ) : (
                      <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
