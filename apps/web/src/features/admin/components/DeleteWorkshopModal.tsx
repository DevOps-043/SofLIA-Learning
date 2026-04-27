'use client'

import { useEffect, useState } from 'react'
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import type { AdminWorkshop } from '../services/adminWorkshops.service'
import { AdminButton, AdminModalShell, AdminStatusBadge, AdminSurface } from './ui'
import { useAdminTheme } from '../hooks/useAdminTheme'

interface DeleteWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  workshop: AdminWorkshop | null
  onConfirm: () => Promise<void>
}

export function DeleteWorkshopModal({ isOpen, onClose, workshop, onConfirm }: DeleteWorkshopModalProps) {
  const theme = useAdminTheme()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  useEffect(() => {
    if (isOpen) {
      setDeleteError(null)
    }
  }, [isOpen, workshop?.id])

  const handleConfirm = async () => {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await onConfirm()
    } catch (error) {
      setDeleteError(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t('generic.errorDeleting'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (!workshop) return null

  return (
    <AdminModalShell
      className="max-w-lg"
      description={t('generic.irreversible')}
      icon={ExclamationTriangleIcon}
      isOpen={isOpen}
      onClose={onClose}
      title={t('workshops.deleteModal.title')}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AdminButton disabled={isDeleting} onClick={onClose} variant="secondary">
            {tc('actions.cancel')}
          </AdminButton>
          <AdminButton disabled={isDeleting} icon={TrashIcon} onClick={handleConfirm} variant="danger">
            {isDeleting ? tc('actions.deleting') : tc('actions.delete')}
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: theme.dangerSurface, color: theme.danger }}
          >
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold" style={{ color: theme.text }}>
              {t('workshops.deleteModal.confirmText')}
            </h3>
            <p className="mt-1 text-sm leading-6" style={{ color: theme.textMuted }}>
              {t('generic.irreversible')}
            </p>
          </div>
        </div>

        <AdminSurface className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                {workshop.title}
              </h4>
              <p className="mt-1 text-xs" style={{ color: theme.textMuted }}>
                {workshop.instructor_name || 'Sin instructor'}
              </p>
            </div>
            <AdminStatusBadge tone={workshop.is_active ? 'success' : 'neutral'}>
              {workshop.is_active ? 'Activo' : 'Inactivo'}
            </AdminStatusBadge>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Categoria
              </dt>
              <dd className="mt-1 font-medium" style={{ color: theme.text }}>
                {workshop.category}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Nivel
              </dt>
              <dd className="mt-1 font-medium" style={{ color: theme.text }}>
                {workshop.level}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Estudiantes
              </dt>
              <dd className="mt-1 font-medium" style={{ color: theme.text }}>
                {workshop.student_count}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                Duracion
              </dt>
              <dd className="mt-1 font-medium" style={{ color: theme.text }}>
                {workshop.duration_total_minutes} min
              </dd>
            </div>
          </dl>
        </AdminSurface>

        {workshop.student_count > 0 ? (
          <AdminSurface className="p-4" style={{ backgroundColor: theme.warningSurface, borderColor: theme.warningSurface }}>
            <p className="text-sm font-medium" style={{ color: theme.warning }}>
              Este taller tiene {workshop.student_count} estudiante{workshop.student_count > 1 ? 's' : ''} inscrito
              {workshop.student_count > 1 ? 's' : ''}. Las inscripciones tambien se eliminaran.
            </p>
          </AdminSurface>
        ) : null}

        {deleteError ? (
          <AdminSurface className="p-4" style={{ backgroundColor: theme.dangerSurface, borderColor: theme.dangerSurface }}>
            <p className="text-sm font-medium" style={{ color: theme.danger }}>
              {deleteError}
            </p>
          </AdminSurface>
        ) : null}
      </div>
    </AdminModalShell>
  )
}
