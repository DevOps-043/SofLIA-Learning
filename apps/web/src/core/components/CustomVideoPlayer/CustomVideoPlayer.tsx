'use client';

import React, { forwardRef } from 'react';
import { CustomVideoPlayerControls } from './player/CustomVideoPlayerControls';
import {
  type CustomVideoPlayerProps,
  type CustomVideoPlayerRef,
} from './player/types';
import { useCustomVideoPlayerState } from './player/useCustomVideoPlayerState';

export type { CustomVideoPlayerRef } from './player/types';

export const CustomVideoPlayer = forwardRef<
  CustomVideoPlayerRef,
  CustomVideoPlayerProps
>((props, ref) => {
  const controller = useCustomVideoPlayerState(props, ref);

  return (
    <div
      className={`relative w-full bg-[#0F1419] dark:bg-[#0F1419] rounded-xl overflow-hidden group ${controller.className}`}
      onMouseEnter={controller.onRootMouseEnter}
      onMouseLeave={controller.onRootMouseLeave}
      onMouseMove={controller.onRootMouseMove}
      ref={controller.containerRef}
    >
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
