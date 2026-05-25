import type { ReactNode } from 'react'

export interface BusinessPanelStatCardProps {
  title: string
  value: number | string
  icon: ReactNode
  iconColor: string
  delay?: number
  trend?: number
  onClick?: () => void
  compact?: boolean
}
