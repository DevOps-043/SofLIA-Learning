'use client';

import React from 'react';
import { clearOnboardingSeen, hasSeenOnboarding } from './onboarding-agent/storage';

/**
 * Utilidad para resetear el onboarding
 * Útil para desarrollo y testing
 */
export function resetOnboarding() {
  if (typeof window !== 'undefined') {
    clearOnboardingSeen(window.localStorage);
  }
}

/**
 * Hook para verificar si el usuario ha visto el onboarding
 */
export function useHasSeenOnboarding() {
  if (typeof window === 'undefined') return true;
  return hasSeenOnboarding(window.localStorage);
}

/**
 * Botón de desarrollo para resetear onboarding
 * Solo visible en desarrollo
 */
export const DevResetOnboardingButton: React.FC = () => {
  // Solo mostrar en desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.NEXT_PUBLIC_ENV === 'development';
  
  if (!isDevelopment) return null;

  return (
    <button
      onClick={resetOnboarding}
      className="fixed bottom-4 left-4 z-[10000] px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded-lg shadow-lg transition-colors"
      title="Resetear onboarding (solo desarrollo)"
    >
      🔄 Reset Onboarding
    </button>
  );
};
