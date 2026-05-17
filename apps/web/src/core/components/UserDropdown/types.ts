import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface UserDropdownProps {
  className?: string
  user?: unknown
}

export interface MenuItemProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  rightElement?: ReactNode
  highlight?: boolean
}

export const USER_DROPDOWN_BACKDROP_Z_INDEX = 1000002
export const USER_DROPDOWN_MENU_Z_INDEX = 1000003
