import type { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import type { useBusinessUsersPageLogic } from '@/features/business-panel/hooks/useBusinessUsersPageLogic'

export type BusinessUsersPageLogic = ReturnType<typeof useBusinessUsersPageLogic>
export type BusinessUsersTheme = ReturnType<typeof useBusinessPanelTheme>
