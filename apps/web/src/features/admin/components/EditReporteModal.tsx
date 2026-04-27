'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ClipboardList } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AdminReporte } from '../services/adminReportes.service'
import { useAdminTheme } from '../hooks/useAdminTheme'
import {
  AdminButton,
  AdminFormField,
  AdminModalShell,
  AdminSelect,
  AdminSurface,
  AdminTextarea,
} from './ui'

interface EditReporteModalProps {
  reporte: AdminReporte
  isOpen: boolean
  onClose: () => void
  onSave: (
    reporteId: string,
    updates: {
      estado?: AdminReporte['estado']
      admin_asignado?: string
      notas_admin?: string
      prioridad?: AdminReporte['prioridad']
    },
  ) => Promise<void>
  isProcessing: boolean
}

export function EditReporteModal({
  reporte,
  isOpen,
  onClose,
  onSave,
  isProcessing,
}: EditReporteModalProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [estado, setEstado] = useState(reporte.estado)
  const [prioridad, setPrioridad] = useState(reporte.prioridad)
  const [notasAdmin, setNotasAdmin] = useState(reporte.notas_admin || '')

  useEffect(() => {
    setEstado(reporte.estado)
    setPrioridad(reporte.prioridad)
    setNotasAdmin(reporte.notas_admin || '')
  }, [reporte])

  const handleSave = async () => {
    await onSave(reporte.id, {
      estado,
      prioridad,
      notas_admin: notasAdmin.trim() || undefined,
    })
  }

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={ClipboardList}
      title={t('reportsPage.modal.editTitle')}
      description={t('reportsPage.modal.reportId', { id: reporte.id.slice(0, 8) })}
      className="max-w-2xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AdminButton onClick={onClose} disabled={isProcessing} variant="secondary">
            {t('reportsPage.modal.cancel')}
          </AdminButton>
          <AdminButton
            onClick={() => void handleSave()}
            disabled={isProcessing}
            icon={CheckCircle2}
          >
            {isProcessing ? t('reportsPage.modal.saving') : t('reportsPage.modal.saveChanges')}
          </AdminButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminFormField label={t('reportsPage.modal.status')}>
            <AdminSelect
              className="w-full"
              value={estado || 'pendiente'}
              onChange={(event) => setEstado(event.target.value as AdminReporte['estado'])}
            >
              <option value="pendiente">{t('reportsPage.status.pending')}</option>
              <option value="en_revision">{t('reportsPage.status.inReview')}</option>
              <option value="en_progreso">{t('reportsPage.status.inProgress')}</option>
              <option value="resuelto">{t('reportsPage.status.resolved')}</option>
              <option value="rechazado">{t('reportsPage.status.rejected')}</option>
              <option value="duplicado">{t('reportsPage.status.duplicated')}</option>
            </AdminSelect>
          </AdminFormField>

          <AdminFormField label={t('reportsPage.modal.priority')}>
            <AdminSelect
              className="w-full"
              value={prioridad || 'media'}
              onChange={(event) => setPrioridad(event.target.value as AdminReporte['prioridad'])}
            >
              <option value="baja">{t('reportsPage.priorities.low')}</option>
              <option value="media">{t('reportsPage.priorities.medium')}</option>
              <option value="alta">{t('reportsPage.priorities.high')}</option>
              <option value="critica">{t('reportsPage.priorities.critical')}</option>
            </AdminSelect>
          </AdminFormField>
        </div>

        <AdminFormField label={t('reportsPage.modal.adminNotes')}>
          <AdminTextarea
            value={notasAdmin}
            onChange={(event) => setNotasAdmin(event.target.value)}
            rows={6}
            placeholder={t('reportsPage.modal.adminNotesPlaceholder')}
            className="resize-none"
          />
        </AdminFormField>

        <AdminSurface className="p-4">
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.text }}>
            {t('reportsPage.modal.reportSummary')}
          </h3>
          <dl className="mt-3 space-y-2 text-sm" style={{ color: theme.text }}>
            <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
              <dt className="font-semibold" style={{ color: theme.textMuted }}>{t('reportsPage.modal.titleLabel')}</dt>
              <dd className="min-w-0 break-words">{reporte.titulo}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
              <dt className="font-semibold" style={{ color: theme.textMuted }}>{t('reportsPage.modal.category')}</dt>
              <dd className="min-w-0 break-words">{reporte.categoria}</dd>
            </div>
            {reporte.usuario ? (
              <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
                <dt className="font-semibold" style={{ color: theme.textMuted }}>{t('reportsPage.modal.user')}</dt>
                <dd className="min-w-0 break-words">
                  {reporte.usuario.display_name || reporte.usuario.username}
                </dd>
              </div>
            ) : null}
          </dl>
        </AdminSurface>
      </div>
    </AdminModalShell>
  )
}
