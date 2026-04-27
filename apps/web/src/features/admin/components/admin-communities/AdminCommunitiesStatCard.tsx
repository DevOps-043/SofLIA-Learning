'use client'

import type { LucideIcon } from 'lucide-react'

import { AdminMetricCard } from '../ui'

interface AdminCommunitiesStatCardProps {
  title: string
  value: number
  Icon: LucideIcon
  iconColor?: string
  gradientClassName?: string
  delay?: number
  trend?: number
}

export function AdminCommunitiesStatCard({
  title,
  value,
  Icon,
}: AdminCommunitiesStatCardProps) {
  return (
    <AdminMetricCard
      label={title}
      value={value.toLocaleString()}
      icon={Icon}
      tone="primary"
    />
  )
}
