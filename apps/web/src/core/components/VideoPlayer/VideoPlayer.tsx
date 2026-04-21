'use client';

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Loader2, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import type { MediaPlaybackContext } from '@/lib/media';
import { useMediaPlaybackPolicy } from '@/core/hooks/useMediaPlaybackPolicy';
import { CustomVideoPlayer, type CustomVideoPlayerRef } from '../CustomVideoPlayer/CustomVideoPlayer';

interface VideoPlayerProps {
  videoProvider: 'youtube' | 'vimeo' | 'direct' | 'custom';
  videoProviderId: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onPiPChange?: (isPiP: boolean) => void;
  initialTime?: number;
  initialPlaybackRate?: number;
  playbackContext?: MediaPlaybackContext;
  // Video tracking props
  lessonId?: string;
  trackingId?: string;
}

// Re-export the interface for external use
export type { CustomVideoPlayerRef as VideoPlayerRef };

// 🔧 OPTIMIZATION: Create Supabase client once, outside component
let supabaseClient: ReturnType<typeof createClient> | null = null;
const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  return supabaseClient;
};

// 🔧 OPTIMIZATION: Cache for video URLs to avoid repeated computations
const videoUrlCache = new Map<string, string>();

// 🔧 OPTIMIZATION: Helper function to generate video URL (memoizable)
const generateVideoUrl = (videoProvider: string, videoProviderId: string): string => {
  const cacheKey = `${videoProvider}:${videoProviderId}`;

  // Return cached URL if available
  if (videoUrlCache.has(cacheKey)) {
    return videoUrlCache.get(cacheKey)!;
  }

  let url = '';

  switch (videoProvider) {
    case 'youtube': {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      url = `https://www.youtube.com/embed/${videoProviderId}?enablejsapi=1${origin ? `&origin=${origin}` : ''}`;
      break;
    }
    case 'vimeo':
      url = `https://player.vimeo.com/video/${videoProviderId}`;
      break;
    case 'direct':
    case 'custom': {
      url = videoProviderId;

      // If URL is relative (doesn't start with http), reconstruct it
      if (url && !url.startsWith('http')) {
        let filePath = url;
        if (!filePath.includes('/')) {
          filePath = `videos/${filePath}`;
        } else if (!filePath.startsWith('course-videos/') && !filePath.startsWith('videos/')) {
          filePath = `videos/${filePath}`;
        }

        // 🔧 OPTIMIZATION: Use cached Supabase client
        try {
          const supabase = getSupabaseClient();
          const { data: urlData } = supabase.storage
            .from('course-videos')
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) {
            url = urlData.publicUrl;
          } else {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            if (supabaseUrl) {
              url = `${supabaseUrl}/storage/v1/object/public/course-videos/${filePath}`;
            }
          }
        } catch {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          if (supabaseUrl) {
            url = `${supabaseUrl}/storage/v1/object/public/course-videos/${filePath}`;
          }
        }
      }
      break;
    }
    default:
      url = '';
  }

  // Cache the result
  if (url) {
    videoUrlCache.set(cacheKey, url);
  }

  return url;
};

export const VideoPlayer = forwardRef<CustomVideoPlayerRef, VideoPlayerProps>(({
  videoProvider,
  videoProviderId,
  title,
  className = '',
  onProgress,
  onComplete,
  onPiPChange,
  initialTime = 0,
  initialPlaybackRate = 1,
  playbackContext = 'lesson',
  lessonId,
  trackingId
}, ref) => {
  // 🐛 DEBUG: SYNC log (runs immediately, before hooks)

  // 🐛 DEBUG: Log props received (async, after first render)
  useEffect(() => {
  }, [videoProvider, lessonId, trackingId]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasActivatedEmbed, setHasActivatedEmbed] = useState(false);
  const customVideoRef = useRef<CustomVideoPlayerRef>(null);
  const playbackPolicy = useMediaPlaybackPolicy(playbackContext);
  const { t } = useTranslation('common');

  // Forward the ref to the CustomVideoPlayer
  useImperativeHandle(ref, () => ({
    requestPiP: async () => {
      if (customVideoRef.current) {
        await customVideoRef.current.requestPiP();
      }
    },
    exitPiP: async () => {
      if (customVideoRef.current) {
        await customVideoRef.current.exitPiP();
      }
    },
    isPlaying: () => customVideoRef.current?.isPlaying() ?? false,
    isPiPActive: () => customVideoRef.current?.isPiPActive() ?? false,
    getVideoElement: () => customVideoRef.current?.getVideoElement() ?? null
  }), []);

  // 🔧 OPTIMIZATION: Memoize video URL to prevent recalculation on every render
  const videoUrl = useMemo(() => {
    if (!videoProvider || !videoProviderId) return '';
    const url = generateVideoUrl(videoProvider, videoProviderId);
    // Debug: Log the generated URL in development
    if (process.env.NODE_ENV === 'development') {
    }
    return url;
  }, [videoProvider, videoProviderId]);

  // 🔧 OPTIMIZATION: Memoize validation
  const isValidVideoData = useMemo(() => {
    if (!videoProvider || !videoProviderId) {
      return false;
    }

    if (videoProvider === 'youtube' && !videoProviderId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      return false;
    }

    if (videoProvider === 'vimeo' && !videoProviderId.match(/^\d+$/)) {
      return false;
    }

    return true;
  }, [videoProvider, videoProviderId]);

  // Timeout para ocultar el loader si el video tarda mucho en cargar
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  // Reset loading state when video changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setHasActivatedEmbed(false);
  }, [videoProviderId]);

  // Manejar carga del iframe
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Manejar errores del iframe
  const handleIframeError = () => {
    setIsLoading(false);
    setError('Error al cargar el video');
  };

  // Renderizar contenido según el proveedor
  const renderVideoContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-[#0A2540] dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>{error}</p>
            <p className="text-sm text-[#6C757D] dark:text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              Proveedor: {videoProvider} | ID: {videoProviderId}
            </p>
          </div>
        </div>
      );
    }

    // Validar datos antes de generar URL (usando valor memoizado)
    if (!isValidVideoData) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-yellow-500 mb-2">⚠️</div>
            <p className="text-gray-600 mb-2">Datos de video inválidos</p>
            <p className="text-sm text-gray-500">
              Proveedor: {videoProvider || 'No especificado'} | ID: {videoProviderId || 'No especificado'}
            </p>
          </div>
        </div>
      );
    }

    // Usar URL memoizada
    if (!videoUrl) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📹</div>
            <p className="text-gray-600">Video no disponible</p>
          </div>
        </div>
      );
    }

    // Para videos directos o custom, usar CustomVideoPlayer con controles personalizados
    if (videoProvider === 'direct' || videoProvider === 'custom') {
      return (
        <CustomVideoPlayer
          ref={customVideoRef}
          src={videoUrl}
          title={title}
          className="w-full h-full"
          onProgress={onProgress}
          onComplete={onComplete}
          onPiPChange={onPiPChange}
          initialTime={initialTime}
          initialPlaybackRate={initialPlaybackRate}
          pauseWhenHidden={playbackPolicy.pauseWhenHidden}
          pauseWhenOutsideViewport={playbackPolicy.pauseWhenOutsideViewport}
          preload={playbackPolicy.nativeVideoPreload}
          lessonId={lessonId}
          trackingId={trackingId}
        />
      );
    }

    // Para YouTube y Vimeo, usar iframe
    // ⚠️ NOTA: El tracking automático NO funciona con YouTube/Vimeo iframes
    // Para tracking completo en estos providers, se requeriría usar sus APIs específicas:
    // - YouTube IFrame API: https://developers.google.com/youtube/iframe_api_reference
    // - Vimeo Player API: https://developer.vimeo.com/player/sdk
    const shouldRenderEmbed =
      !playbackPolicy.shouldUseEmbedFacade || hasActivatedEmbed;
    const thumbnailUrl =
      videoProvider === 'youtube'
        ? `https://img.youtube.com/vi/${videoProviderId}/hqdefault.jpg`
        : null;
    const iframeAllow = [
      'accelerometer',
      playbackPolicy.allowIframeAutoplay ? 'autoplay' : null,
      'clipboard-write',
      'encrypted-media',
      'gyroscope',
      'picture-in-picture',
    ]
      .filter(Boolean)
      .join('; ');

    if (!shouldRenderEmbed) {
      return (
        <button
          type="button"
          className="relative flex h-full min-h-64 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-900 text-white"
          onClick={() => {
            setHasActivatedEmbed(true);
            setIsLoading(true);
          }}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title || t('media.videoPreview')}
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-800" />
          )}
          <span className="relative z-10 flex flex-col items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="h-7 w-7 fill-white text-white" />
            </span>
            <span className="text-sm font-medium">{t('media.tapToPlay')}</span>
          </span>
        </button>
      );
    }

    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1419] dark:bg-[#0F1419] rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-[#00D4B3]" />
          </div>
        )}

        <iframe
          src={videoUrl}
          title={title || 'Video de la lección'}
          className="w-full h-full rounded-lg"
          allow={iframeAllow}
          allowFullScreen
          loading="lazy"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {renderVideoContent()}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

// Componente específico para YouTube con controles personalizados
export function YouTubePlayer({
  videoId,
  title,
  className = '',
  onProgress,
  onComplete,
  initialTime,
  initialPlaybackRate,
  playbackContext
}: {
  videoId: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  initialTime?: number;
  initialPlaybackRate?: number;
  playbackContext?: MediaPlaybackContext;
}) {
  return (
    <VideoPlayer
      videoProvider="youtube"
      videoProviderId={videoId}
      title={title}
      className={className}
      onProgress={onProgress}
      onComplete={onComplete}
      initialTime={initialTime}
      initialPlaybackRate={initialPlaybackRate}
      playbackContext={playbackContext}
    />
  );
}

// Componente específico para Vimeo
export function VimeoPlayer({
  videoId,
  title,
  className = '',
  onProgress,
  onComplete,
  initialTime,
  initialPlaybackRate,
  playbackContext
}: {
  videoId: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  initialTime?: number;
  initialPlaybackRate?: number;
  playbackContext?: MediaPlaybackContext;
}) {
  return (
    <VideoPlayer
      videoProvider="vimeo"
      videoProviderId={videoId}
      title={title}
      className={className}
      onProgress={onProgress}
      onComplete={onComplete}
      initialTime={initialTime}
      initialPlaybackRate={initialPlaybackRate}
      playbackContext={playbackContext}
    />
  );
}

// Componente para videos directos
export function DirectVideoPlayer({
  videoUrl,
  title,
  className = '',
  onProgress,
  onComplete,
  initialTime,
  initialPlaybackRate,
  playbackContext
}: {
  videoUrl: string;
  title?: string;
  className?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  initialTime?: number;
  initialPlaybackRate?: number;
  playbackContext?: MediaPlaybackContext;
}) {
  return (
    <VideoPlayer
      videoProvider="direct"
      videoProviderId={videoUrl}
      title={title}
      className={className}
      onProgress={onProgress}
      onComplete={onComplete}
      initialTime={initialTime}
      initialPlaybackRate={initialPlaybackRate}
      playbackContext={playbackContext}
    />
  );
}
