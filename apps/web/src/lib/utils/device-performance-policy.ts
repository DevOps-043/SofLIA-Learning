const MOBILE_PERFORMANCE_BREAKPOINT_PX = 768;
const LOW_HARDWARE_CONCURRENCY = 4;
const LOW_DEVICE_MEMORY_GB = 4;
const SLOW_EFFECTIVE_TYPES = new Set(['slow-2g', '2g', '3g']);

export interface DevicePerformanceEnvironment {
  deviceMemory?: number;
  effectiveType?: string;
  hardwareConcurrency?: number;
  isCoarsePointer?: boolean;
  maxTouchPoints?: number;
  platform?: string;
  prefersReducedMotion?: boolean;
  saveData?: boolean;
  userAgent?: string;
  viewportWidth?: number;
}

export interface DevicePerformancePolicy {
  deferPrefetch: boolean;
  disableAutoplayAudio: boolean;
  disableHeavyEffects: boolean;
  disableSessionRecorder: boolean;
  isApplePlatform: boolean;
  isCoarsePointer: boolean;
  isConstrainedNetwork: boolean;
  isIOSLike: boolean;
  isLowDeviceMemory: boolean;
  isLowHardwareConcurrency: boolean;
  isMacLike: boolean;
  isMobile: boolean;
  isMobileViewport: boolean;
  isWebKitLike: boolean;
  prefersReducedMotion: boolean;
  reducePolling: boolean;
}

interface NetworkInformationLike {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

function normalize(value?: string): string {
  return value?.toLowerCase() ?? '';
}

function detectIOSLike(environment: DevicePerformanceEnvironment): boolean {
  const userAgent = normalize(environment.userAgent);
  const platform = normalize(environment.platform);

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && (environment.maxTouchPoints ?? 0) > 1)
  );
}

function detectMacLike(environment: DevicePerformanceEnvironment): boolean {
  const userAgent = normalize(environment.userAgent);
  const platform = normalize(environment.platform);

  return platform.startsWith('mac') || /macintosh|mac os x/.test(userAgent);
}

function detectWebKitLike(environment: DevicePerformanceEnvironment): boolean {
  const userAgent = normalize(environment.userAgent);

  if (detectIOSLike(environment)) {
    return true;
  }

  return (
    userAgent.includes('applewebkit') &&
    userAgent.includes('safari') &&
    !/(chrome|chromium|crios|edg|opr|fxios|firefox)/.test(userAgent)
  );
}

function detectMobileUserAgent(userAgent?: string): boolean {
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent ?? '');
}

function isSlowEffectiveType(effectiveType?: string): boolean {
  return Boolean(effectiveType && SLOW_EFFECTIVE_TYPES.has(effectiveType));
}

export function resolveDevicePerformancePolicy(
  environment: DevicePerformanceEnvironment,
): DevicePerformancePolicy {
  const isIOSLike = detectIOSLike(environment);
  const isMacLike = detectMacLike(environment);
  const isApplePlatform = isIOSLike || isMacLike;
  const isWebKitLike = detectWebKitLike(environment);
  const isMobileViewport =
    typeof environment.viewportWidth === 'number' &&
    environment.viewportWidth <= MOBILE_PERFORMANCE_BREAKPOINT_PX;
  const isCoarsePointer = environment.isCoarsePointer === true;
  const isMobile =
    isIOSLike ||
    isMobileViewport ||
    isCoarsePointer ||
    detectMobileUserAgent(environment.userAgent);
  const prefersReducedMotion = environment.prefersReducedMotion === true;
  const isConstrainedNetwork =
    environment.saveData === true || isSlowEffectiveType(environment.effectiveType);
  const isLowHardwareConcurrency =
    typeof environment.hardwareConcurrency === 'number' &&
    environment.hardwareConcurrency > 0 &&
    environment.hardwareConcurrency <= LOW_HARDWARE_CONCURRENCY;
  const isLowDeviceMemory =
    typeof environment.deviceMemory === 'number' &&
    environment.deviceMemory > 0 &&
    environment.deviceMemory <= LOW_DEVICE_MEMORY_GB;

  const shouldConserve =
    isApplePlatform ||
    isWebKitLike ||
    isMobile ||
    isConstrainedNetwork ||
    prefersReducedMotion ||
    isLowHardwareConcurrency ||
    isLowDeviceMemory;

  return {
    deferPrefetch: shouldConserve,
    disableAutoplayAudio:
      isApplePlatform ||
      isWebKitLike ||
      isMobile ||
      isConstrainedNetwork ||
      prefersReducedMotion,
    disableHeavyEffects: shouldConserve,
    disableSessionRecorder: shouldConserve,
    isApplePlatform,
    isCoarsePointer,
    isConstrainedNetwork,
    isIOSLike,
    isLowDeviceMemory,
    isLowHardwareConcurrency,
    isMacLike,
    isMobile,
    isMobileViewport,
    isWebKitLike,
    prefersReducedMotion,
    reducePolling: shouldConserve,
  };
}

function safeMatchMedia(query: string): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;
  } catch {
    return false;
  }
}

export function getNetworkInformation(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return (
    (navigator as Navigator & { connection?: NetworkInformationLike }).connection ??
    null
  );
}

export function getBrowserDevicePerformanceEnvironment(): DevicePerformanceEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }

  const connection = getNetworkInformation();
  const extendedNavigator = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };

  return {
    deviceMemory: extendedNavigator.deviceMemory,
    effectiveType: connection?.effectiveType,
    hardwareConcurrency: extendedNavigator.hardwareConcurrency,
    isCoarsePointer: safeMatchMedia('(pointer: coarse)'),
    maxTouchPoints: navigator.maxTouchPoints,
    platform: navigator.platform,
    prefersReducedMotion: safeMatchMedia('(prefers-reduced-motion: reduce)'),
    saveData: connection?.saveData,
    userAgent: navigator.userAgent,
    viewportWidth: window.innerWidth,
  };
}

export function resolveBrowserDevicePerformancePolicy(): DevicePerformancePolicy {
  return resolveDevicePerformancePolicy(getBrowserDevicePerformanceEnvironment());
}

export const DEVICE_PERFORMANCE_MEDIA_QUERIES = [
  `(max-width: ${MOBILE_PERFORMANCE_BREAKPOINT_PX}px)`,
  '(pointer: coarse)',
  '(prefers-reduced-motion: reduce)',
] as const;
