/**
 * useInactivityLogout Hook
 * 
 * Hook para logout automático por inactividad.
 * Solo aplica en /courses/[slug]/learn (60 minutos de inactividad)
 * 
 * Características:
 * - Detecta inactividad por falta de eventos de usuario
 * - Muestra modal de advertencia 5 minutos antes del logout
 * - Integra con eventos del sistema (video, LIA, scroll, etc.)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { clearClientSessionState } from '@/features/auth/services/logout-client.service';

interface UseInactivityLogoutOptions {
  /** Tiempo de inactividad antes de logout en minutos (default: 60) */
  timeoutMinutes?: number;
  /** Tiempo de advertencia antes del logout en minutos (default: 5) */
  warningMinutes?: number;
  /** Callback cuando se muestra la advertencia */
  onWarning?: () => void;
  /** Callback cuando se ejecuta el logout */
  onLogout?: () => void;
  /** Habilitar/deshabilitar el hook */
  enabled?: boolean;
}

interface UseInactivityLogoutReturn {
  /** Si el usuario está en estado de advertencia */
  isWarning: boolean;
  /** Minutos restantes antes del logout */
  minutesRemaining: number;
  /** Segundos restantes (para countdown) */
  secondsRemaining: number;
  /** Reiniciar el timer de inactividad */
  resetTimer: () => void;
  /** Mostrar mensaje resumiendo sesión cerrada */
  showSessionClosedMessage: boolean;
  /** Función para cerrar mensaje de sesión cerrada */
  dismissSessionClosedMessage: () => void;
}

const INACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'wheel'
];

// Clave para localStorage
const LAST_ACTIVITY_KEY = 'learn_last_activity_timestamp';
const SESSION_CLOSED_KEY = 'learn_session_closed_by_inactivity';

export function useInactivityLogout(
  options: UseInactivityLogoutOptions = {}
): UseInactivityLogoutReturn {
  const {
    timeoutMinutes = 60,
    warningMinutes = 5,
    onWarning,
    onLogout,
    enabled = true
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  
  const [isWarning, setIsWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningMinutes * 60);
  const [showSessionClosedMessage, setShowSessionClosedMessage] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Verificar si estamos en la ruta /courses/[slug]/learn
  const isLearnRoute = pathname?.includes('/courses/') && pathname?.includes('/learn');

  // Verificar si hay mensaje de sesión cerrada pendiente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionClosed = localStorage.getItem(SESSION_CLOSED_KEY);
      if (sessionClosed === 'true') {
        setShowSessionClosedMessage(true);
        localStorage.removeItem(SESSION_CLOSED_KEY);
      }
    }
  }, []);

  const dismissSessionClosedMessage = useCallback(() => {
    setShowSessionClosedMessage(false);
  }, []);

  // Función para ejecutar logout
  const executeLogout = useCallback(async () => {
    // Guardar flag para mostrar mensaje al volver
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_CLOSED_KEY, 'true');
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    }

    onLogout?.();

    await clearClientSessionState();

    // Redirigir al login
    router.push('/login?reason=inactivity');
  }, [onLogout, router]);

  // Función para mostrar advertencia
  const showWarning = useCallback(() => {
    setIsWarning(true);
    setSecondsRemaining(warningMinutes * 60);
    onWarning?.();

    // Iniciar countdown
    countdownRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          executeLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMinutes, onWarning, executeLogout]);

  // Reiniciar timer
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Guardar en localStorage para persistencia entre tabs
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    }

    // Limpiar timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Resetear estado de advertencia
    setIsWarning(false);
    setSecondsRemaining(warningMinutes * 60);

    if (!enabled || !isLearnRoute) return;

    // Programar advertencia
    const warningDelay = (timeoutMinutes - warningMinutes) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(showWarning, warningDelay);

    // Programar logout (respaldo)
    const logoutDelay = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(executeLogout, logoutDelay);
  }, [enabled, isLearnRoute, timeoutMinutes, warningMinutes, showWarning, executeLogout]);

  // Handler de eventos de actividad
  const handleActivity = useCallback(() => {
    if (isWarning) {
      // Si ya está en advertencia, no reiniciar automáticamente
      // El usuario debe hacer una acción explícita
      return;
    }
    resetTimer();
  }, [isWarning, resetTimer]);

  // Configurar listeners de actividad
  useEffect(() => {
    if (!enabled || !isLearnRoute) return;

    // Agregar listeners
    INACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      INACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [enabled, isLearnRoute, handleActivity, resetTimer]);

  // Calcular minutos restantes
  const minutesRemaining = Math.ceil(secondsRemaining / 60);

  return {
    isWarning,
    minutesRemaining,
    secondsRemaining,
    resetTimer,
    showSessionClosedMessage,
    dismissSessionClosedMessage
  };
}

export default useInactivityLogout;
