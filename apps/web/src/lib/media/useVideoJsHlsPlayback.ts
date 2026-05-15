'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { resolveBrowserDevicePerformancePolicy } from '../utils/device-performance-policy';

import { HLS_MANIFEST_MIME_TYPE, isHlsManifestUrl } from './hls-source';

interface VideoJsPlayer {
  dispose: () => void;
  src: (source: { src: string; type: string }) => void;
}

type VideoJsFactory = (
  element: HTMLVideoElement,
  options: {
    controls: boolean;
    fluid: boolean;
    html5: { vhs: { overrideNative: boolean } };
    preload: string;
    sources: Array<{ src: string; type: string }>;
  }
) => VideoJsPlayer;

export function useVideoJsHlsPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
  preload: string
): void {
  const hlsPlayerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    const isHlsSource = isHlsManifestUrl(src);

    if (!videoElement || !isHlsSource) {
      hlsPlayerRef.current?.dispose();
      hlsPlayerRef.current = null;
      return;
    }

    // Barrera 1 — Apple/WebKit: Safari (iOS, iPadOS, macOS) reproduce HLS de
    // forma nativa con decodificación por hardware (VideoToolbox). Adjuntar
    // video.js fuerza la ruta MSE/VHS por software, que sobrecalienta el
    // dispositivo. Nunca adjuntamos video.js en estas plataformas, aunque
    // `canPlayType` devuelva un valor ambiguo.
    const devicePolicy = resolveBrowserDevicePerformancePolicy();
    if (devicePolicy.isApplePlatform || devicePolicy.isWebKitLike) {
      hlsPlayerRef.current?.dispose();
      hlsPlayerRef.current = null;
      return;
    }

    // Barrera 2 — cualquier otro navegador que reporte soporte HLS nativo.
    const supportsNativeHls =
      videoElement.canPlayType(HLS_MANIFEST_MIME_TYPE) !== '';

    if (supportsNativeHls) {
      hlsPlayerRef.current?.dispose();
      hlsPlayerRef.current = null;
      return;
    }

    const source = {
      src,
      type: HLS_MANIFEST_MIME_TYPE,
    };

    if (hlsPlayerRef.current) {
      hlsPlayerRef.current.src(source);
      return;
    }

    let cancelled = false;

    void import('video.js').then((videoJsModule) => {
      if (cancelled || !videoRef.current) {
        return;
      }

      const videojs = videoJsModule.default as unknown as VideoJsFactory;
      hlsPlayerRef.current = videojs(videoRef.current, {
        controls: false,
        fluid: false,
        html5: {
          vhs: {
            overrideNative: false,
          },
        },
        preload,
        sources: [source],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [preload, src, videoRef]);

  useEffect(() => {
    return () => {
      hlsPlayerRef.current?.dispose();
      hlsPlayerRef.current = null;
    };
  }, []);
}
