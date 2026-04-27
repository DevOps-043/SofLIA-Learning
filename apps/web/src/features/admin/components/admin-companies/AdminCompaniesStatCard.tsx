'use client'

import type { ElementType } from 'react'

import { AdminMetricCard } from '../ui'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompaniesStatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: ElementType
  color: string
  delay: number
  themeColors: AdminCompaniesThemeColors
}

function getToneFromTitle(title: string) {
  const normalized = title.toLowerCase()
  if (normalized.includes('pend')) return 'warning' as const
  if (normalized.includes('paus')) return 'warning' as const
  if (normalized.includes('trial')) return 'info' as const
  if (normalized.includes('uso')) return 'accent' as const
  return 'success' as const
}

export function AdminCompaniesStatCard({
  title,
  value,
  subtitle,
  icon,
}: AdminCompaniesStatCardProps) {
  return (
    <AdminMetricCard
      label={title}
      value={value}
      description={subtitle}
      icon={icon}
      tone={getToneFromTitle(title)}
    />
  )
}
