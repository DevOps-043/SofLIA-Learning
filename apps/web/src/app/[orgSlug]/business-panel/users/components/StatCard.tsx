'use client'

export { BusinessPanelStatCard as StatCard } from '@/features/business-panel/components/shared/BusinessPanelStatCard'

// El tipo se re-exporta desde su modulo de origen: `BusinessPanelStatCard.tsx`
// lo consume con un import de solo-tipo, por lo que no forma parte de sus
// exportaciones y no puede reenviarse desde ahi.
export type { BusinessPanelStatCardProps as StatCardProps } from '@/features/business-panel/components/shared/business-panel-stat-card.types'
