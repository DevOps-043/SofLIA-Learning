'use client'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

/**
 * Tema visual canonico para el superadmin.
 *
 * El panel de organizacion ya contiene los tokens finales del sistema visual.
 * Este adapter permite migrar el superadmin pantalla por pantalla sin acoplar
 * los componentes de admin al nombre "business" en cada archivo.
 */
export function useAdminPanelTheme() {
  return useBusinessPanelTheme()
}

export type AdminPanelThemeTokens = ReturnType<typeof useAdminPanelTheme>
