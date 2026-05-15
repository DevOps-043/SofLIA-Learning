'use client';

import React, { forwardRef } from 'react';
import { CustomVideoPlayerControls } from './player/CustomVideoPlayerControls';
import {
  type CustomVideoPlayerProps,
  type CustomVideoPlayerRef,
} from './player/types';
import { useCustomVideoPlayerState } from './player/useCustomVideoPlayerState';
import { useVideoJsHlsPlayback } from '@/lib/media/useVideoJsHlsPlayback';

export type { CustomVideoPlayerRef } from './player/types';

export const CustomVideoPlayer = forwardRef<
  CustomVideoPlayerRef,
  CustomVideoPlayerProps
>((props, ref) => {
  const baseController = useCustomVideoPlayerState(props, ref);
  const quality = useVideoJsHlsPlayback(
    baseController.videoRef,
    baseController.src,
    baseController.preload,
  );
  const controller = { ...baseController, quality };

  return (
    <div
      className={`relative w-full bg-[#0F1419] dark:bg-[#0F1419] rounded-xl overflow-hidden group ${controller.className}`}
      onMouseEnter={controller.onRootMouseEnter}
      onMouseLeave={controller.onRootMouseLeave}
      onMouseMove={controller.onRootMouseMove}
      ref={controller.containerRef}
    >
      {/*
        Sin `key={controller.src}`: el cambio de fuente ya se propaga por el
        atributo `src` controlado y por el `useEffect([src])` de
        useCustomVideoPlayerState (resetea estado). Forzar el remontaje del
        <video> destruía/recreaba el decodificador en cada cambio de fuente,
        sumando calor en móviles (iOS).
      */}
      <video
        className="w-full h-full object-contain"
        onClick={() => {
          void controller.togglePlay();
        }}
        onError={controller.handleVideoError}
        onLoadedData={controller.handleVideoLoadedData}
        onLoadStart={controller.handleVideoLoadStart}
        playsInline
        preload={controller.preload}
        ref={controller.videoRef}
        src={controller.src}
      />

      <CustomVideoPlayerControls controller={controller} />
    </div>
  );
});

CustomVideoPlayer.displayName = 'CustomVideoPlayer';
