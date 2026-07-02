'use client'

import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'

interface GeneralDangerZoneCardProps {
  onDeleteClick: () => void
}

export function GeneralDangerZoneCard({ onDeleteClick }: GeneralDangerZoneCardProps) {
  return (
    <Card
      title="Zona de peligro"
      description="Acciones irreversibles sobre esta organización"
      icon={ExclamationTriangleIcon}
      iconColor={colors.error}
    >
      <div
        className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: `color-mix(in srgb, ${colors.error} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${colors.error} 6%, transparent)` }}
      >
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Eliminar organización</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-muted">
            Se eliminarán permanentemente todos los datos de la organización: cursos asignados, progreso,
            certificados, analítica, notificaciones, chats y estructura jerárquica. Las cuentas de usuario
            de sus miembros <strong>no</strong> se eliminan — solo perderán su afiliación a esta organización.
            Esta acción no se puede deshacer.
          </p>
        </div>
        <button
          type="button"
          onClick={onDeleteClick}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: colors.error }}
        >
          <TrashIcon className="h-4 w-4" />
          Eliminar organización
        </button>
      </div>
    </Card>
  )
}
