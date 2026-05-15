'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import { resolveBrowserDevicePerformancePolicy } from '../utils/device-performance-policy';

import { HLS_MANIFEST_MIME_TYPE, isHlsManifestUrl } from './hls-source';
import { fetchHlsRenditions, type HlsRendition } from './hls-master-parser';

interface VideoJsRepresentation {
  id: string;
  bandwidth: number;
  width: number;
  height: number;
  enabled: (enabled?: boolean) => boolean;
}

interface VideoJsVhsTech {
  representations: () => VideoJsRepresentation[];
}

interface VideoJsPlayer {
  dispose: () => void;
  src: (source: { src: string; type: string }) => void;
  tech: (options: { IWillNotUseThisInPlugins: boolean }) => {
    vhs?: VideoJsVhsTech;
  };
}

type VideoJsFactory = (
  element: HTMLVideoElement,
  options: {
    controls: boolean;
    fluid: boolean;
    html5: { vhs: { overrideNative: boolean } };
    preload: string;
    sources: Array<{ src: string; type: string }>;
  },
) => VideoJsPlayer;

export interface HlsQualityController {
  /** True when the active src is an HLS playlist. */
  isHls: boolean;
  /**
   * True when HLS is being decoded natively (Safari, iOS, iPadOS).  In this
   * mode we cannot programmatically force a specific rendition — the OS
   * does adaptive bitrate selection.  The UI should hide the quality
   * selector in this case.
   */
  isNativeHls: boolean;
  /** Renditions parsed from the master playlist.  Empty until loaded. */
  availableRenditions: HlsRendition[];
  /** Currently forced rendition height.  null = adaptive (Auto). */
  selectedHeight: number | null;
  /** Force a specific rendition by height, or null to return to Auto. */
  setQualityLevel: (height: number | null) => void;
}

interface UseHlsPlaybackResult extends HlsQualityController {}

export function useVideoJsHlsPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
  preload: string,
): UseHlsPlaybackResult {
  const hlsPlayerRef = useRef<VideoJsPlayer | null>(null);

  const isHls = isHlsManifestUrl(src);

  const [isNativeHls, setIsNativeHls] = useState(false);
  const [availableRenditions, setAvailableRenditions] = useState<HlsRendition[]>([]);
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);

  // Reset selection when src changes.
  useEffect(() => {
    setSelectedHeight(null);
    setAvailableRenditions([]);
    setIsNativeHls(false);
  }, [src]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement || !isHls) {
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
      setIsNativeHls(true);
      return;
    }

    // Barrera 2 — cualquier otro navegador que reporte soporte HLS nativo.
    const supportsNativeHls =
      videoElement.canPlayType(HLS_MANIFEST_MIME_TYPE) !== '';

    if (supportsNativeHls) {
      hlsPlayerRef.current?.dispose();
      hlsPlayerRef.current = null;
      setIsNativeHls(true);
      return;
    }

    setIsNativeHls(false);

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
  }, [isHls, preload, src, videoRef]);

  useEffect(() => {
    return () => {
      hlsPlayerRef.current?.dispose();
      hlsPlayerRef.current = null;
    };
  }, []);

  // Parse the master.m3u8 to populate the available renditions list.
  // Runs once per src.  Native-HLS clients still parse so the UI can show
  // metadata (even if the selector is hidden in iOS for control reasons).
  useEffect(() => {
    if (!isHls) {
      setAvailableRenditions([]);
      return;
    }

    const controller = new AbortController();
    void fetchHlsRenditions(src, controller.signal).then((renditions) => {
      if (controller.signal.aborted) return;
      setAvailableRenditions(renditions ?? []);
    });
    return () => {
      controller.abort();
    };
  }, [isHls, src]);

  /**
   * Force a specific rendition (or return to Auto).
   * - With video.js + VHS: enable only the matching representation, disable
   *   all others.  null → enable all (Auto / adaptive).
   * - With native HLS (Safari): no-op.  We only allow Auto.  The setter
   *   still updates state so the UI reflects the user's intent.
   */
  const setQualityLevel = useCallback((height: number | null) => {
    setSelectedHeight(height);

    const player = hlsPlayerRef.current;
    if (!player) return;

    try {
      const tech = player.tech({ IWillNotUseThisInPlugins: true });
      const reps = tech?.vhs?.representations?.();
      if (!reps || reps.length === 0) return;

      for (const rep of reps) {
        if (height === null) {
          rep.enabled(true);
        } else {
          rep.enabled(rep.height === height);
        }
      }
    } catch (error) {
      // VHS tech may not be ready yet — non-fatal.
      console.warn('[useVideoJsHlsPlayback] setQualityLevel failed:', error);
    }
  }, []);

  return {
    isHls,
    isNativeHls,
    availableRenditions,
    selectedHeight,
    setQualityLevel,
  };
}
