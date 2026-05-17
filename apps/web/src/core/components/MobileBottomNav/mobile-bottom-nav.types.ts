import type { LucideIcon } from 'lucide-react'

export interface MobileNavItem {
  id: string
  name: string
  icon: LucideIcon
  route: string | null
}

export interface DirectoryNavOption {
  id: string
  name: string
  description: string
  icon: LucideIcon
  route: string
  gradient: string
}

export type PrefetchOnHover = (href: string) => {
  onMouseEnter: () => void
}
