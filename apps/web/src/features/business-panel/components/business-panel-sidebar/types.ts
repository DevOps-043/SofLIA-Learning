import type { Dispatch, SetStateAction } from 'react'
import type { TFunction } from 'i18next'
import type { LucideIcon } from 'lucide-react'
import type { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export interface BusinessPanelSidebarProps {
  activeSection: string
  isCollapsed: boolean
  isOpen: boolean
  isPinned: boolean
  onClose: () => void
  onHoverExpand?: () => void
  onSectionChange: (section: string) => void
  onToggleCollapse: () => void
  onTogglePin: () => void
}

export interface SidebarNavigationItem {
  href: string
  icon: LucideIcon
  id: string
  name: string
}

export type BusinessPanelTheme = ReturnType<typeof useBusinessPanelTheme>
export type SidebarTranslator = TFunction<'business'>
export type SetHoveredState = Dispatch<SetStateAction<boolean>>
