export type MediaPlaybackContext = 'lesson' | 'tour' | 'attachment' | 'preview';

export type NativeVideoPreload = 'none' | 'metadata' | 'auto';

export interface MediaPlaybackEnvironment {
  effectiveType?: string;
  maxTouchPoints?: number;
  platform?: string;
  prefersReducedMotion?: boolean;
  saveData?: boolean;
  userAgent?: string;
  viewportWidth?: number;
}

export interface MediaPlaybackPolicy {
  allowAutoplay: boolean;
  allowIframeAutoplay: boolean;
  context: MediaPlaybackContext;
  isConstrainedNetwork: boolean;
  isIOSLike: boolean;
  isMobile: boolean;
  isMobileViewport: boolean;
  isWebKitLike: boolean;
  nativeVideoPreload: NativeVideoPreload;
  pauseWhenHidden: boolean;
  pauseWhenOutsideViewport: boolean;
  prefersReducedMotion: boolean;
  requiresUserGesture: boolean;
  shouldPrefetchVideo: boolean;
  shouldUseEmbedFacade: boolean;
}

const MOBILE_VIEWPORT_MAX_WIDTH_PX = 768;
const SLOW_EFFECTIVE_TYPES = new Set(['slow-2g', '2g', '3g']);

interface NetworkInformationLike {
  effectiveType?: string;
  saveData?: boolean;
}

function normalize(value?: string): string {
  return value?.toLowerCase() ?? '';
}

function detectIOSLike(environment: MediaPlaybackEnvironment): boolean {
  const userAgent = normalize(environment.userAgent);
  const platform = normalize(environment.platform);

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && (environment.maxTouchPoints ?? 0) > 1)
  );
}

function detectWebKitLike(environment: MediaPlaybackEnvironment): boolean {
  const userAgent = normalize(environment.userAgent);

  if (detectIOSLike(environment)) {
    return true;
  }

  return (
    userAgent.includes('applewebkit') &&
    userAgent.includes('safari') &&
    !/(chrome|chromium|edg|opr|firefox)/.test(userAgent)
  );
}

function detectMobileUserAgent(userAgent?: string): boolean {
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent ?? '');
}

function isSlowEffectiveType(effectiveType?: string): boolean {
  return Boolean(effectiveType && SLOW_EFFECTIVE_TYPES.has(effectiveType));
}

export function resolveMediaPlaybackPolicy(
  environment: MediaPlaybackEnvironment,
  context: MediaPlaybackContext
): MediaPlaybackPolicy {
  const isIOSLike = detectIOSLike(environment);
  const isWebKitLike = detectWebKitLike(environment);
  const isMobileViewport =
    typeof environment.viewportWidth === 'number' &&
    environment.viewportWidth <= MOBILE_VIEWPORT_MAX_WIDTH_PX;
  const isMobile = isMobileViewport || detectMobileUserAgent(environment.userAgent);
  const prefersReducedMotion = environment.prefersReducedMotion === true;
  const isConstrainedNetwork =
    environment.saveData === true || isSlowEffectiveType(environment.effectiveType);
  const requiresUserGesture =
    isMobile || isIOSLike || prefersReducedMotion || isConstrainedNetwork;
  const shouldConserve = requiresUserGesture || isWebKitLike;

  return {
    allowAutoplay: !requiresUserGesture,
    allowIframeAutoplay: !requiresUserGesture,
    context,
    isConstrainedNetwork,
    isIOSLike,
    isMobile,
    isMobileViewport,
    isWebKitLike,
    nativeVideoPreload: shouldConserve
      ? 'none'
      : context === 'tour'
        ? 'auto'
        : 'metadata',
    pauseWhenHidden: true,
    pauseWhenOutsideViewport: shouldConserve || context !== 'lesson',
    prefersReducedMotion,
    requiresUserGesture,
    shouldPrefetchVideo: context === 'tour' && !shouldConserve,
    shouldUseEmbedFacade: shouldConserve || context === 'attachment',
  };
}

export function shouldUseEmbedFacade(policy: MediaPlaybackPolicy): boolean {
  return policy.shouldUseEmbedFacade;
}

export function getNativeVideoPreload(
  policy: MediaPlaybackPolicy
): NativeVideoPreload {
  return policy.nativeVideoPreload;
}

function safeMatchMedia(query: string): boolean {
  try {
    return typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;
  } catch {
    return false;
  }
}

function getNetworkInformation(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return (
    (navigator as Navigator & { connection?: NetworkInformationLike }).connection ??
    null
  );
}

export function getBrowserMediaPlaybackEnvironment(): MediaPlaybackEnvironment {
  const connection = getNetworkInformation();

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }

  return {
    effectiveType: connection?.effectiveType,
    maxTouchPoints: navigator.maxTouchPoints,
    platform: navigator.platform,
    prefersReducedMotion: safeMatchMedia('(prefers-reduced-motion: reduce)'),
    saveData: connection?.saveData,
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
  };
}

export function resolveBrowserMediaPlaybackPolicy(
  context: MediaPlaybackContext
): MediaPlaybackPolicy {
  return resolveMediaPlaybackPolicy(getBrowserMediaPlaybackEnvironment(), context);
}
