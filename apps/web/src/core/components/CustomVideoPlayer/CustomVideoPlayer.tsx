'use client';

import React, { forwardRef } from 'react';
import { CustomVideoPlayerControls } from './player/CustomVideoPlayerControls';
import {
  type CustomVideoPlayerProps,
  type CustomVideoPlayerRef,
} from './player/types';
import { useCustomVideoPlayerState } from './player/useCustomVideoPlayerState';
import { useHlsPlayback } from '@/lib/media/useHlsPlayback';

export type { CustomVideoPlayerRef } from './player/types';

export const CustomVideoPlayer = forwardRef<
  CustomVideoPlayerRef,
  CustomVideoPlayerProps
>((props, ref) => {
  const baseController = useCustomVideoPlayerState(props, ref);
  const quality = useHlsPlayback(
    baseController.videoRef,
    baseController.src,
  );
  const controller = { ...baseController, quality };

  return (
    <div
      className={`relative w-full bg-carbon-900 dark:bg-carbon-900 rounded-xl overflow-hidden group ${controller.className}`}
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

        `src` SOLO se asigna cuando la reproducción es nativa (MP4 o HLS en
        Safari). Cuando hls.js gestiona la fuente (Chrome/Brave/Edge/Firefox),
        el atributo `src` se omite: hls.js alimenta el <video> via MSE y un
        `src` .m3u8 nativo competiría y rompería la reproducción.
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
        src={controller.quality.usesNativeSource ? controller.src : undefined}
      />

      <CustomVideoPlayerControls controller={controller} />
    </div>
  );
});

CustomVideoPlayer.displayName = 'CustomVideoPlayer';
