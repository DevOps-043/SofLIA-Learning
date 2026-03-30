/**
 * Inactivity Detector para rrweb
 * Pausa la grabación cuando el usuario está inactivo para ahorrar recursos
 */

'use client';

export interface InactivityConfig {
  inactivityThreshold: number; // ms antes de considerar inactivo
  checkInterval: number; // ms entre verificaciones
  onInactive?: () => void;
  onActive?: () => void;
}

const DEFAULT_CONFIG: InactivityConfig = {
  inactivityThreshold: 60000, // 1 minuto
  checkInterval: 10000, // 10 segundos
};

let lastActivity = Date.now();
let isActive = true;
let checkIntervalId: NodeJS.Timeout | null = null;
let isDetectorRunning = false;

// Eventos que indican actividad
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
  'click'
];

/**
 * Manejador de actividad
 */
function handleActivity() {
  lastActivity = Date.now();
  
  if (!isActive) {
    isActive = true;
  }
}

/**
 * Inicia el detector de inactividad
 */
export function startInactivityDetector(
  config: Partial<InactivityConfig> = {},
  callbacks?: { onInactive?: () => void; onActive?: () => void }
): void {
  if (typeof window === 'undefined' || isDetectorRunning) return;
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  isDetectorRunning = true;
  lastActivity = Date.now();
  isActive = true;
  
  // Agregar listeners de actividad
  ACTIVITY_EVENTS.forEach(event => {
    window.addEventListener(event, handleActivity, { passive: true });
  });
  
  // Verificar inactividad periódicamente
  checkIntervalId = setInterval(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    
    if (isActive && timeSinceActivity > finalConfig.inactivityThreshold) {
      isActive = false;
      callbacks?.onInactive?.();
    } else if (!isActive && timeSinceActivity <= finalConfig.inactivityThreshold) {
      isActive = true;
      callbacks?.onActive?.();
    }
  }, finalConfig.checkInterval);
  
}

/**
 * Detiene el detector de inactividad
 */
export function stopInactivityDetector(): void {
  if (!isDetectorRunning) return;
  
  ACTIVITY_EVENTS.forEach(event => {
    window.removeEventListener(event, handleActivity);
  });
  
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  
  isDetectorRunning = false;
}

/**
 * Verifica si el usuario está actualmente activo
 */
export function isUserActive(): boolean {
  return isActive;
}

/**
 * Obtiene el tiempo desde la última actividad en ms
 */
export function getTimeSinceLastActivity(): number {
  return Date.now() - lastActivity;
}

/**
 * Obtiene el tiempo desde la última actividad formateado
 */
export function getTimeSinceLastActivityFormatted(): string {
  const ms = getTimeSinceLastActivity();
  
  if (ms < 1000) return 'Hace un momento';
  if (ms < 60000) return `Hace ${Math.round(ms / 1000)} segundos`;
  if (ms < 3600000) return `Hace ${Math.round(ms / 60000)} minutos`;
  return `Hace ${Math.round(ms / 3600000)} horas`;
}

/**
 * Resetea manualmente el timer de actividad
 */
export function resetActivityTimer(): void {
  lastActivity = Date.now();
  isActive = true;
}
