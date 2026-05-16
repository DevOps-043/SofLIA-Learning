'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { colors } from '../shared'

export function StatsErrorState() {
  return (
    <div className="py-20 text-center">
      <ExclamationTriangleIcon className="mx-auto mb-4 h-10 w-10" style={{ color: colors.error }} />
      <p className="text-white/60">No pudimos cargar las estadísticas</p>
    </div>
  )
}
