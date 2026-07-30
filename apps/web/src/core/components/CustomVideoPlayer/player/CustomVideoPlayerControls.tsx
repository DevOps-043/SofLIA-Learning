'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Maximize2,
  Minimize2,
  MonitorCog,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import styles from './CustomVideoPlayerControls.module.css';
import type { CustomVideoPlayerController } from './types';

type SettingsPanel = 'main' | 'quality' | 'speed';

interface CustomVideoPlayerControlsProps {
  controller: CustomVideoPlayerController;
}

export function CustomVideoPlayerControls({
  controller,
}: CustomVideoPlayerControlsProps) {
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>('main');

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
  const progressPercentage =
    controller.duration > 0
      ? (controller.currentTime / controller.duration) * 100
      : 0;
  const volumePercentage =
    (controller.isMuted ? 0 : controller.volume) * 100;

  return (
    <>
      {controller.isLoading && (
        <div
          className={styles.loadingOverlay}
          data-video-loading-indicator="true"
        >
          <div className={styles.spinner} />
        </div>
      )}

      {controller.isBuffering && controller.isPlaying && (
        <div
          className={styles.bufferingOverlay}
          data-video-buffering-indicator="true"
        >
          <div className={styles.spinner} />
        </div>
      )}

      <AnimatePresence>
        {controller.showControls && (
          <motion.div
            animate={{ opacity: 1 }}
            className={styles.controlsOverlay}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className={styles.skipControls}>
              <button
                type="button"
                className={styles.skipButton}
                onClick={() => controller.skip(-10)}
                title="Retroceder 10 segundos"
                aria-label="Retroceder 10 segundos"
              >
                <RotateCcw aria-hidden="true" />
                <span className={styles.skipValue}>10</span>
              </button>
              <button
                type="button"
                className={styles.skipButton}
                disabled={controller.isSeekingLocked}
                onClick={() => controller.skip(10)}
                title="Adelantar 10 segundos"
                aria-label="Adelantar 10 segundos"
              >
                <span className={styles.skipValue}>10</span>
                <RotateCw aria-hidden="true" />
              </button>
            </div>

            {!controller.isPlaying && (
              <div className={styles.centerPlay}>
                <motion.button
                  type="button"
                  animate={{ opacity: 1, scale: 1 }}
                  className={styles.playButton}
                  exit={{ opacity: 0, scale: 0.88 }}
                  initial={{ opacity: 0, scale: 0.88 }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void controller.togglePlay();
                  }}
                  aria-label="Reproducir video"
                >
                  <Play aria-hidden="true" />
                </motion.button>
              </div>
            )}

            <div className={styles.controlDock}>
              <div
                className={`${styles.progressHitArea} ${
                  controller.isDraggingProgress ? styles.progressDragging : ''
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
                <div className={styles.progressTrack}>
                  <motion.div
                    className={styles.progressFill}
                    initial={false}
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <span className={styles.progressThumb} />
                  </motion.div>
                </div>
              </div>

              <div className={styles.controlRow}>
                <div className={styles.controlGroup}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void controller.togglePlay();
                    }}
                    title={controller.isPlaying ? 'Pausar' : 'Reproducir'}
                    aria-label={controller.isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {controller.isPlaying ? (
                      <Pause aria-hidden="true" />
                    ) : (
                      <Play aria-hidden="true" />
                    )}
                  </button>

                  <div
                    className={styles.volumeWrapper}
                    onMouseEnter={() => controller.setShowVolumeControl(true)}
                    onMouseLeave={() => controller.setShowVolumeControl(false)}
                  >
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        controller.toggleMute();
                      }}
                      title={controller.isMuted ? 'Activar sonido' : 'Silenciar'}
                      aria-label={
                        controller.isMuted ? 'Activar sonido' : 'Silenciar'
                      }
                    >
                      {controller.isMuted || controller.volume === 0 ? (
                        <VolumeX aria-hidden="true" />
                      ) : (
                        <Volume2 aria-hidden="true" />
                      )}
                    </button>

                    <AnimatePresence>
                      {controller.showVolumeControl && (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className={styles.volumePopover}
                          exit={{ opacity: 0, y: 6 }}
                          initial={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.14 }}
                        >
                          <div
                            className={styles.volumeTrack}
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
                            aria-label="Volumen"
                          >
                            <motion.div
                              className={styles.volumeFill}
                              initial={false}
                              style={{ height: `${volumePercentage}%` }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className={styles.timecode}>
                    <span>{controller.formatTime(controller.currentTime)}</span>
                    <span className={styles.timeSeparator}>/</span>
                    <span>{controller.formatTime(controller.duration)}</span>
                  </div>
                </div>

                <div className={styles.controlGroup}>
                  <div className={styles.settingsWrapper}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() =>
                        controller.setShowSettings((current) => !current)
                      }
                      title="Configuración"
                      aria-label="Abrir configuración del video"
                      aria-expanded={controller.showSettings}
                    >
                      <Settings2 aria-hidden="true" />
                    </button>

                    <AnimatePresence>
                      {controller.showSettings && (
                        <motion.div
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={styles.settingsMenu}
                          exit={{ opacity: 0, scale: 0.98, y: 5 }}
                          initial={{ opacity: 0, scale: 0.98, y: 5 }}
                          transition={{ duration: 0.14 }}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {settingsPanel === 'main' && (
                              <motion.div
                                key="main"
                                animate={{ opacity: 1, x: 0 }}
                                className={styles.menuList}
                                exit={{ opacity: 0, x: -10 }}
                                initial={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.1 }}
                              >
                                <button
                                  type="button"
                                  className={styles.menuItem}
                                  onClick={() => setSettingsPanel('speed')}
                                >
                                  <span className={styles.menuIcon}>
                                    <Gauge aria-hidden="true" />
                                  </span>
                                  <span className={styles.menuLabel}>
                                    Velocidad
                                  </span>
                                  <span className={styles.menuValue}>
                                    {speedLabel}
                                  </span>
                                  <ChevronRight
                                    className={styles.menuChevron}
                                    aria-hidden="true"
                                  />
                                </button>

                                {hasQualitySelector && (
                                  <button
                                    type="button"
                                    className={styles.menuItem}
                                    onClick={() => setSettingsPanel('quality')}
                                  >
                                    <span className={styles.menuIcon}>
                                      <MonitorCog aria-hidden="true" />
                                    </span>
                                    <span className={styles.menuLabel}>
                                      Calidad
                                    </span>
                                    <span className={styles.menuValue}>
                                      {qualityLabel}
                                    </span>
                                    <ChevronRight
                                      className={styles.menuChevron}
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}

                                <div className={styles.menuDivider} />

                                <button
                                  type="button"
                                  className={styles.menuItem}
                                  onClick={() => {
                                    void controller.togglePictureInPicture();
                                  }}
                                >
                                  <span className={styles.menuIcon}>
                                    <PictureInPicture2 aria-hidden="true" />
                                  </span>
                                  <span className={styles.menuLabel}>
                                    Imagen en imagen
                                  </span>
                                </button>
                              </motion.div>
                            )}

                            {settingsPanel === 'speed' && (
                              <motion.div
                                key="speed"
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                initial={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.1 }}
                              >
                                <div className={styles.menuHeader}>
                                  <button
                                    type="button"
                                    className={styles.backButton}
                                    onClick={() => setSettingsPanel('main')}
                                    aria-label="Volver a configuración"
                                  >
                                    <ChevronLeft aria-hidden="true" />
                                  </button>
                                  <span className={styles.menuHeading}>
                                    Velocidad de reproducción
                                  </span>
                                </div>

                                <div className={styles.menuList}>
                                  {controller.playbackRates.map((rate) => {
                                    const isActive =
                                      controller.playbackRate === rate;
                                    return (
                                      <button
                                        type="button"
                                        key={rate}
                                        className={`${styles.menuItem} ${
                                          isActive ? styles.optionActive : ''
                                        }`}
                                        onClick={() => {
                                          controller.changePlaybackRate(rate);
                                          setSettingsPanel('main');
                                        }}
                                      >
                                        <Check
                                          className={`${styles.optionCheck} ${
                                            isActive
                                              ? styles.optionCheckVisible
                                              : ''
                                          }`}
                                          aria-hidden="true"
                                        />
                                        <span className={styles.optionLabel}>
                                          {rate === 1 ? 'Normal' : `${rate}×`}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}

                            {settingsPanel === 'quality' && (
                              <motion.div
                                key="quality"
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                initial={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.1 }}
                              >
                                <div className={styles.menuHeader}>
                                  <button
                                    type="button"
                                    className={styles.backButton}
                                    onClick={() => setSettingsPanel('main')}
                                    aria-label="Volver a configuración"
                                  >
                                    <ChevronLeft aria-hidden="true" />
                                  </button>
                                  <span className={styles.menuHeading}>
                                    Calidad
                                  </span>
                                </div>

                                <div className={styles.menuList}>
                                  <button
                                    type="button"
                                    className={`${styles.menuItem} ${
                                      controller.quality.selectedHeight === null
                                        ? styles.optionActive
                                        : ''
                                    }`}
                                    onClick={() => {
                                      controller.quality.setQualityLevel(null);
                                      setSettingsPanel('main');
                                    }}
                                  >
                                    <Check
                                      className={`${styles.optionCheck} ${
                                        controller.quality.selectedHeight === null
                                          ? styles.optionCheckVisible
                                          : ''
                                      }`}
                                      aria-hidden="true"
                                    />
                                    <span className={styles.optionLabel}>
                                      Auto
                                    </span>
                                    <span className={styles.optionHint}>
                                      adaptativo
                                    </span>
                                  </button>

                                  {controller.quality.availableRenditions.map(
                                    (rendition) => {
                                      const isActive =
                                        controller.quality.selectedHeight ===
                                        rendition.height;
                                      return (
                                        <button
                                          type="button"
                                          key={rendition.height}
                                          className={`${styles.menuItem} ${
                                            isActive ? styles.optionActive : ''
                                          }`}
                                          onClick={() => {
                                            controller.quality.setQualityLevel(
                                              rendition.height,
                                            );
                                            setSettingsPanel('main');
                                          }}
                                        >
                                          <Check
                                            className={`${styles.optionCheck} ${
                                              isActive
                                                ? styles.optionCheckVisible
                                                : ''
                                            }`}
                                            aria-hidden="true"
                                          />
                                          <span className={styles.optionLabel}>
                                            {rendition.label}
                                          </span>
                                        </button>
                                      );
                                    },
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
                    type="button"
                    className={styles.iconButton}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void controller.toggleFullscreen();
                    }}
                    title={
                      controller.isFullscreen
                        ? 'Salir de pantalla completa'
                        : 'Pantalla completa'
                    }
                    aria-label={
                      controller.isFullscreen
                        ? 'Salir de pantalla completa'
                        : 'Pantalla completa'
                    }
                  >
                    {controller.isFullscreen ? (
                      <Minimize2 aria-hidden="true" />
                    ) : (
                      <Maximize2 aria-hidden="true" />
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
