/**
 * Gate de admisión para el grabador global de sesiones (rrweb).
 *
 * Responsabilidad única: decidir si el recorder debe iniciarse en el
 * entorno actual. NO inicia ni detiene nada por sí mismo.
 *
 * Motivación: rrweb es costoso en CPU/GPU/memoria. En viewport móvil,
 * conexiones lentas o dispositivos con preferencia de reduced-motion
 * provoca sobrecalentamiento y degrada la UX. Este gate corta temprano
 * en esos escenarios y habilita un opt-out manual para QA/soporte.
 */

import {
  getBrowserDevicePerformanceEnvironment,
  resolveDevicePerformancePolicy,
} from '../utils/device-performance-policy';

const DISABLE_STORAGE_KEY = 'soflia.disableSessionRecorder';
const FORCE_ENABLE_STORAGE_KEY = 'soflia.forceSessionRecorder';
const SLOW_EFFECTIVE_TYPES = new Set(['slow-2g', '2g', '3g']);

export type RecordingGateReason =
  | 'server'
  | 'force-enabled'
  | 'disabled-by-flag'
  | 'save-data'
  | 'slow-connection'
  | 'apple-platform'
  | 'webkit'
  | 'mobile-viewport'
  | 'low-hardware'
  | 'low-memory'
  | 'reduced-motion'
  | 'allowed';

export interface RecordingGateDecision {
  allowed: boolean;
  reason: RecordingGateReason;
}

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

function safeGetStorageItem(key: string): string | null {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
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
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav) return null;
  const conn = (nav as unknown as { connection?: NetworkInformationLike }).connection;
  return conn ?? null;
}

/**
 * Evalúa si el recorder puede arrancar en el entorno actual.
 *
 * Orden de chequeos (fail-fast):
 * 1. SSR → no permitido
 * 2. Force-enable flag (QA/soporte) → permitido
 * 3. Disable flag (usuario opt-out) → no permitido
 * 4. save-data → no permitido
 * 5. Conexión lenta (2g/3g/slow-2g) → no permitido
 * 6. Viewport móvil (<=768px) → no permitido
 * 7. prefers-reduced-motion → no permitido
 * 8. allowed
 */
export function evaluateRecordingGate(): RecordingGateDecision {
  if (typeof window === 'undefined') {
    return { allowed: false, reason: 'server' };
  }

  if (safeGetStorageItem(FORCE_ENABLE_STORAGE_KEY) === '1') {
    return { allowed: true, reason: 'force-enabled' };
  }

  if (safeGetStorageItem(DISABLE_STORAGE_KEY) === '1') {
    return { allowed: false, reason: 'disabled-by-flag' };
  }

  const connection = getNetworkInformation();
  if (connection?.saveData) {
    return { allowed: false, reason: 'save-data' };
  }
  if (connection?.effectiveType && SLOW_EFFECTIVE_TYPES.has(connection.effectiveType)) {
    return { allowed: false, reason: 'slow-connection' };
  }

  const performancePolicy = resolveDevicePerformancePolicy(
    getBrowserDevicePerformanceEnvironment(),
  );

  if (performancePolicy.isApplePlatform) {
    return { allowed: false, reason: 'apple-platform' };
  }

  if (performancePolicy.isWebKitLike) {
    return { allowed: false, reason: 'webkit' };
  }

  if (performancePolicy.isMobileViewport || performancePolicy.isMobile) {
    return { allowed: false, reason: 'mobile-viewport' };
  }

  if (performancePolicy.isLowHardwareConcurrency) {
    return { allowed: false, reason: 'low-hardware' };
  }

  if (performancePolicy.isLowDeviceMemory) {
    return { allowed: false, reason: 'low-memory' };
  }

  if (safeMatchMedia('(prefers-reduced-motion: reduce)')) {
    return { allowed: false, reason: 'reduced-motion' };
  }

  return { allowed: true, reason: 'allowed' };
}

export function shouldRecordSession(): boolean {
  return evaluateRecordingGate().allowed;
}

export const RECORDING_GATE_STORAGE_KEYS = {
  disable: DISABLE_STORAGE_KEY,
  forceEnable: FORCE_ENABLE_STORAGE_KEY,
} as const;
