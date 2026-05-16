'use client'

import type { ReactNode } from 'react'
import { BusinessPanelStatCard } from '@/features/business-panel/components/shared/BusinessPanelStatCard'

interface AdminCommunitiesStatCardProps {
  title: string
  value: number
  icon: ReactNode
  iconColor: string
  delay: number
  subtitle?: string
}

export function AdminCommunitiesStatCard({
  title,
  value,
  icon,
  iconColor,
  delay,
  subtitle,
}: AdminCommunitiesStatCardProps) {
  return (
    <BusinessPanelStatCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      delay={delay}
      compact
    />
  )
}
