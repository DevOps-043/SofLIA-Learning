'use client'

import { AlertTriangle, Clock, Layers3, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import { formatWorkshopDuration, getAdminWorkshopCategoryConfig, getAdminWorkshopLevelConfig, getAdminWorkshopStatusConfig } from '../admin-workshops/admin-workshops-display.service'

export function DeleteWorkshopDetails({ workshop }: { workshop: AdminWorkshop }) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()
  const categoryConfig = getAdminWorkshopCategoryConfig(workshop.category, theme)
  const levelConfig = getAdminWorkshopLevelConfig(workshop.level, theme)
  const statusConfig = getAdminWorkshopStatusConfig(workshop.is_active, theme)
  const categoryLabel = tc(`common.categories.${workshop.category}`, workshop.category)
  const levelLabel = levelConfig.labelKey ? t(levelConfig.labelKey) : levelConfig.fallbackLabel
  const statusLabel = statusConfig.labelKey ? t(statusConfig.labelKey) : statusConfig.fallbackLabel
  const details = [
    { label: t('workshops.editor.preview.stats.category'), value: categoryLabel, color: categoryConfig.color, bg: categoryConfig.bg, border: categoryConfig.border, icon: Layers3 },
    { label: t('workshops.editor.preview.stats.level'), value: levelLabel, color: levelConfig.color, bg: levelConfig.bg, border: levelConfig.border, icon: Layers3 },
    { label: t('workshops.editor.preview.stats.status'), value: statusLabel, color: statusConfig.color, bg: statusConfig.bg, border: statusConfig.border, icon: AlertTriangle },
    { label: t('workshops.card.instructorLabel'), value: workshop.instructor_name || t('workshops.card.noInstructor'), color: theme.primaryColor, bg: theme.actionSurface, border: theme.heroBorderColor, icon: UserRound },
    { label: t('workshops.editor.preview.stats.duration'), value: formatWorkshopDuration(workshop.duration_total_minutes), color: theme.subtextColor, bg: theme.inputBg, border: theme.borderColor, icon: Clock },
  ]

  return (
    <div className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <h4 className="mb-3 font-semibold" style={{ color: theme.textColor }}>{workshop.title}</h4>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        {details.map((detail) => <DeleteWorkshopDetailCard key={detail.label} {...detail} />)}
        {workshop.student_count > 0 ? <DeleteWorkshopStudentWarning count={workshop.student_count} /> : null}
      </div>
    </div>
  )
}

function DeleteWorkshopDetailCard(props: { label: string; value: string; color: string; bg: string; border: string; icon: typeof Clock }) {
  const theme = useAdminPanelTheme()
  const Icon = props.icon
  return (
    <div className="rounded-xl border px-3 py-2" style={{ backgroundColor: props.bg, borderColor: props.border }}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: props.color }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>{props.label}</span>
      </div>
      <p className="mt-1 truncate font-semibold" style={{ color: theme.textColor }}>{props.value}</p>
    </div>
  )
}

function DeleteWorkshopStudentWarning({ count }: { count: number }) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="rounded-xl border px-3 py-2 sm:col-span-2" style={{ backgroundColor: `color-mix(in srgb, ${theme.warningColor} 7.8%, transparent)`, borderColor: `color-mix(in srgb, ${theme.warningColor} 14.9%, transparent)` }}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" style={{ color: theme.warningColor }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>{t('workshops.card.studentsLabel')}</span>
      </div>
      <p className="mt-1 font-semibold" style={{ color: theme.textColor }}>{count}</p>
    </div>
  )
}
