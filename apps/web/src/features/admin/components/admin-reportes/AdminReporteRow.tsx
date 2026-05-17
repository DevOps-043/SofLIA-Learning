'use client'

import { Clock, Eye, Image, Pencil, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminReporte } from '../../services/adminReportes.service'
import { getEstadoBadgeClass, getPrioridadBadgeClass } from './admin-reportes.badges'
import { formatReporteDate, getReporteLabel, getReporterName } from './admin-reportes.helpers'
import { ReporteBadge } from './ReporteBadge'

interface AdminReporteRowProps {
  reporte: AdminReporte
  onView: (reporte: AdminReporte) => void
  onEdit: (reporte: AdminReporte) => void
}

export function AdminReporteRow({ reporte, onView, onEdit }: AdminReporteRowProps) {
  const { t } = useTranslation('admin')

  return (
    <article className="group p-5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 transition-colors group-hover:text-slate-700 dark:text-white">{reporte.titulo}</h3>
            <ReporteBadge className={getPrioridadBadgeClass(reporte.prioridad)}>{getReporteLabel(t, 'priority', reporte.prioridad)}</ReporteBadge>
            <ReporteBadge className={getEstadoBadgeClass(reporte.estado)}>{getReporteLabel(t, 'status', reporte.estado)}</ReporteBadge>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{reporte.descripcion}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-slate-200 px-2.5 py-1 dark:border-white/10">{getReporteLabel(t, 'category', reporte.categoria)}</span>
            {reporte.usuario ? <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{getReporterName(reporte)}</span> : null}
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatReporteDate(reporte.created_at)}</span>
            {reporte.screenshot_url ? <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300"><Image className="h-3.5 w-3.5" />{t('reportesPage.hasImage')}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => onView(reporte)} className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:text-white" aria-label={t('reportesPage.actions.view')}><Eye className="h-4 w-4" /></button>
          <button type="button" onClick={() => onEdit(reporte)} className="rounded-2xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:text-white" aria-label={t('reportesPage.actions.edit')}><Pencil className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  )
}
