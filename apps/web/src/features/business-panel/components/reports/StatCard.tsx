'use client'

import type { ElementType } from 'react'
import { BusinessPanelStatCard } from '../shared/BusinessPanelStatCard'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: ElementType
  color: string
}) {
  return (
    <BusinessPanelStatCard
      title={label}
      value={value}
      icon={<Icon className="w-5 h-5" />}
      iconColor={color}
    />
  )
}

export { StatCard }
