import { useRef, useEffect, useCallback } from 'react';

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Distancia mínima en píxeles para considerar un swipe
  velocity?: number; // Velocidad mínima en píxeles/ms para considerar un swipe
  enabled?: boolean; // Si está habilitado o no
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
}

/**
 * Hook personalizado para detectar gestos de swipe (deslizamiento)
 * 
 * @param options - Opciones de configuración
 * @returns Ref que debe ser asignado al elemento que detectará los swipes
 * 
 * @example
 * ```tsx
 * const swipeRef = useSwipe({
 *   onSwipeLeft: () => logger.log('Swipe izquierda'),
 *   onSwipeRight: () => logger.log('Swipe derecha'),
 *   enabled: isMobile
 * });
 * 
 * return <div ref={swipeRef}>...</div>
 * ```
 */
export function useSwipe<T extends HTMLElement = HTMLDivElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50, // 50px por defecto
  velocity = 0.3, // 0.3px/ms por defecto
  enabled = true
}: UseSwipeOptions = {}) {
  const elementRef = useRef<T>(null);
  const touchDataRef = useRef<TouchData | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    touchDataRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    };
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Prevenir scroll si detectamos un swipe horizontal
    if (touchDataRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchDataRef.current.startX);
      const deltaY = Math.abs(touch.clientY - touchDataRef.current.startY);
      
      // Si el movimiento horizontal es mayor que el vertical, prevenir scroll
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchDataRef.current || e.changedTouches.length !== 1) {
      touchDataRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const { startX, startY, startTime } = touchDataRef.current;
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;
    const distance = Math.abs(deltaX);
    const velocityValue = distance / deltaTime;

    // Verificar que sea un swipe horizontal (más horizontal que vertical)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    // Verificar que cumpla con el threshold y la velocidad mínima
    const meetsThreshold = distance >= threshold;
    const meetsVelocity = velocityValue >= velocity;

    if (isHorizontalSwipe && meetsThreshold && meetsVelocity) {
      if (deltaX > 0 && onSwipeRight) {
        // Swipe de izquierda a derecha
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        // Swipe de derecha a izquierda
        onSwipeLeft();
      }
    }

    touchDataRef.current = null;
  }, [enabled, threshold, velocity, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    // Agregar event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      // Limpiar event listeners
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return elementRef;
}

