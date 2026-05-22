'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

import type Hls from 'hls.js';

import { resolveBrowserDevicePerformancePolicy } from '../utils/device-performance-policy';

import { HLS_MANIFEST_MIME_TYPE, isHlsManifestUrl } from './hls-source';
import { fetchHlsRenditions, type HlsRendition } from './hls-master-parser';

export interface HlsQualityController {
  /** True cuando la fuente activa es una playlist HLS (.m3u8). */
  isHls: boolean;
  /**
   * True cuando HLS se decodifica de forma nativa (Safari, iOS, iPadOS).
   * En ese modo el sistema operativo gestiona el bitrate adaptativo y no se
   * puede forzar una resolucion concreta — la UI oculta el selector.
   */
  isNativeHls: boolean;
  /**
   * True cuando el elemento `<video>` debe recibir el atributo `src` nativo.
   * Es `false` solo cuando hls.js gestiona la reproduccion via MSE (en ese
   * caso el `<video>` NO debe tener `src` para no competir con hls.js).
   */
  usesNativeSource: boolean;
  /** Renditions del master playlist. Vacio hasta que carga. */
  availableRenditions: HlsRendition[];
  /** Altura de la rendition forzada. null = adaptativo (Auto). */
  selectedHeight: number | null;
  /** Fuerza una rendition por altura, o null para volver a Auto. */
  setQualityLevel: (height: number | null) => void;
}

/**
 * Reproduccion HLS basada en hls.js.
 *
 * A diferencia de video.js, hls.js NO se apropia del elemento `<video>` ni
 * de su DOM: solo alimenta buffers MSE. Por eso convive sin conflictos con
 * un `<video>` controlado por React y con controles custom.
 *
 * Estrategia por plataforma:
 * - Safari / iOS / WebKit: HLS nativo (VideoToolbox por hardware). No se
 *   adjunta hls.js. El `<video>` recibe el `src` .m3u8 directamente.
 * - Resto de navegadores (Chrome, Brave, Edge, Firefox): hls.js sobre MSE.
 *   El `<video>` NO recibe `src`; hls.js hace `attachMedia` + `loadSource`.
 * - Fuentes no-HLS (MP4): `src` nativo directo.
 */
export function useHlsPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
): HlsQualityController {
  const hlsRef = useRef<Hls | null>(null);

  const isHls = isHlsManifestUrl(src);

  const [isNativeHls, setIsNativeHls] = useState(false);
  const [availableRenditions, setAvailableRenditions] = useState<HlsRendition[]>(
    [],
  );
  const [selectedHeight, setSelectedHeight] = useState<number | null>(null);

  // Reinicia la seleccion cuando cambia la fuente.
  useEffect(() => {
    setSelectedHeight(null);
    setAvailableRenditions([]);
    setIsNativeHls(false);
  }, [src]);

  useEffect(() => {
    const videoElement = videoRef.current;

    function destroyHls() {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }

    // Fuente no-HLS (MP4): el `<video src>` nativo es suficiente.
    if (!videoElement || !isHls) {
      destroyHls();
      return;
    }

    // Safari / iOS / WebKit: HLS nativo por hardware. No adjuntar hls.js.
    const devicePolicy = resolveBrowserDevicePerformancePolicy();
    const supportsNativeHls =
      videoElement.canPlayType(HLS_MANIFEST_MIME_TYPE) !== '';

    if (
      devicePolicy.isApplePlatform ||
      devicePolicy.isWebKitLike ||
      supportsNativeHls
    ) {
      destroyHls();
      setIsNativeHls(true);
      return;
    }

    setIsNativeHls(false);

    let cancelled = false;

    void import('hls.js').then((hlsModule) => {
      if (cancelled) return;
      const element = videoRef.current;
      if (!element) return;

      const HlsCtor = hlsModule.default;

      // Navegador sin MSE: ultimo recurso, dejar el `src` nativo (degrada).
      if (!HlsCtor.isSupported()) {
        setIsNativeHls(true);
        return;
      }

      destroyHls();

      const hls = new HlsCtor({
        enableWorker: true,
        lowLatencyMode: false,
        // ABR adaptativo: hls.js elige el bitrate segun el ancho de banda
        // medido. startLevel -1 = arranca en auto.
        startLevel: -1,
        // Buffers moderados: suficiente para conexiones lentas sin inflar
        // memoria en dispositivos modestos.
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 30,
      });

      hlsRef.current = hls;

      hls.on(HlsCtor.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        switch (data.type) {
          case HlsCtor.ErrorTypes.NETWORK_ERROR:
            techDebtLogger.warn('[useHlsPlayback] network error, reintentando');
            hls.startLoad();
            break;
          case HlsCtor.ErrorTypes.MEDIA_ERROR:
            techDebtLogger.warn('[useHlsPlayback] media error, recuperando');
            hls.recoverMediaError();
            break;
          default:
            techDebtLogger.error('[useHlsPlayback] error fatal no recuperable');
            destroyHls();
            break;
        }
      });

      hls.attachMedia(element);
      hls.on(HlsCtor.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });
    });

    return () => {
      cancelled = true;
      destroyHls();
    };
  }, [isHls, src, videoRef]);

  // Parsea el master.m3u8 para poblar el selector de calidad.
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
   * Fuerza una rendition por altura (o vuelve a Auto).
   * - hls.js: mapea altura -> indice de nivel y fija `currentLevel`.
   *   null -> currentLevel = -1 (adaptativo).
   * - HLS nativo (Safari): no-op a nivel de decodificador; solo refleja la
   *   intencion del usuario en el estado de la UI.
   */
  const setQualityLevel = useCallback((height: number | null) => {
    setSelectedHeight(height);

    const hls = hlsRef.current;
    if (!hls) return;

    if (height === null) {
      hls.currentLevel = -1;
      return;
    }

    const levelIndex = hls.levels.findIndex((level) => level.height === height);
    if (levelIndex >= 0) {
      hls.currentLevel = levelIndex;
    }
  }, []);

  return {
    isHls,
    isNativeHls,
    usesNativeSource: !isHls || isNativeHls,
    availableRenditions,
    selectedHeight,
    setQualityLevel,
  };
}
