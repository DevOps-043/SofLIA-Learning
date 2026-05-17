'use client'

import { Flag, ListChecks } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import { REPORTE_ESTADO_OPTIONS, REPORTE_PRIORIDAD_OPTIONS } from '../admin-reportes.options'

interface EditReporteFormProps {
  estado: string
  prioridad: string
  notasAdmin: string
  onEstadoChange: (value: string) => void
  onPrioridadChange: (value: string) => void
  onNotasChange: (value: string) => void
}

export function EditReporteForm(props: EditReporteFormProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const statusOptions = REPORTE_ESTADO_OPTIONS.filter((item) => item.value !== 'all').map((item) => ({ value: item.value, label: t(item.labelKey) }))
  const priorityOptions = REPORTE_PRIORIDAD_OPTIONS.filter((item) => item.value !== 'all').map((item) => ({ value: item.value, label: t(item.labelKey) }))

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FieldLabel label={t('reportesPage.editModal.status')}><PremiumSelect value={props.estado} onValueChange={props.onEstadoChange} options={statusOptions} icon={<ListChecks className="h-4 w-4" />} /></FieldLabel>
        <FieldLabel label={t('reportesPage.editModal.priority')}><PremiumSelect value={props.prioridad} onValueChange={props.onPrioridadChange} options={priorityOptions} icon={<Flag className="h-4 w-4" />} /></FieldLabel>
      </div>
      <label className="block space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>{t('reportesPage.editModal.adminNotes')}</span>
        <textarea
          value={props.notasAdmin}
          onChange={(event) => props.onNotasChange(event.target.value)}
          rows={6}
          placeholder={t('reportesPage.editModal.notesPlaceholder')}
          className="w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
        />
      </label>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  const theme = useAdminPanelTheme()
  return <label className="block space-y-2"><span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>{label}</span>{children}</label>
}
