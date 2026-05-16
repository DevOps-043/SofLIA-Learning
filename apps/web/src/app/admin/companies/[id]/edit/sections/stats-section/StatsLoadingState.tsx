'use client'

import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { colors } from '../shared'

export function StatsLoadingState() {
  return (
    <div className="py-20 text-center">
      <ArrowPathIcon className="mx-auto mb-4 h-10 w-10 animate-spin" style={{ color: colors.accent }} />
      <p className="text-white/60">Calculando métricas en tiempo real...</p>
    </div>
  )
}
