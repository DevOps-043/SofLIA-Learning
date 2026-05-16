'use client'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { colors } from '../shared'

export function UsersEmptyState() {
  return (
    <div className="py-8 text-center">
      <MagnifyingGlassIcon className="mx-auto mb-3 h-12 w-12" style={{ color: colors.grayMedium }} />
      <p className="text-sm" style={{ color: colors.grayMedium }}>No se encontraron elementos</p>
    </div>
  )
}
