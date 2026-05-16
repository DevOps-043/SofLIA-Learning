'use client'

import { BookOpen, Clock, UserCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { ChangeEventHandler } from 'react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AddWorkshopBasicTabProps {
  formData: { title: string; description: string; instructor_id: string; duration_total_minutes: number | string }
  instructors: Array<{ id: string; name: string }>
  errors: Record<string, string>
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
}

export function AddWorkshopBasicTab(props: AddWorkshopBasicTabProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const fieldStyle = (hasError = false) => ({ backgroundColor: theme.inputBg, borderColor: hasError ? theme.dangerColor : theme.borderColor, color: theme.textColor })
  const labelStyle = { color: theme.mutedTextColor }
  const iconStyle = { color: theme.subtextColor }
  return (
    <motion.div key="basic" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="group">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.titleLabel')}</label>
        <div className="relative"><BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={iconStyle} /><input type="text" name="title" value={props.formData.title} onChange={props.onChange} className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200" style={fieldStyle(Boolean(props.errors.title))} placeholder={t('workshops.addModal.titlePlaceholder')} required /></div>
        {props.errors.title ? <p className="mt-1 text-xs" style={{ color: theme.dangerColor }}>{props.errors.title}</p> : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.descriptionLabel')}</label>
        <textarea name="description" value={props.formData.description} onChange={props.onChange} rows={4} className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={fieldStyle(Boolean(props.errors.description))} placeholder={t('workshops.addModal.descriptionPlaceholder')} required />
        {props.errors.description ? <p className="mt-1 text-xs" style={{ color: theme.dangerColor }}>{props.errors.description}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="group">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.instructorLabel')}</label>
          <div className="relative"><UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={iconStyle} /><select name="instructor_id" value={props.formData.instructor_id} onChange={props.onChange} className="w-full cursor-pointer appearance-none rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200" style={fieldStyle(Boolean(props.errors.instructor_id))} required><option value="">{t('workshops.editor.config.instructorPlaceholder')}</option>{props.instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name}</option>)}</select></div>
          {props.errors.instructor_id ? <p className="mt-1 text-xs" style={{ color: theme.dangerColor }}>{props.errors.instructor_id}</p> : null}
        </div>
        <div className="group">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.durationLabel')}</label>
          <div className="relative"><Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={iconStyle} /><input type="number" name="duration_total_minutes" value={props.formData.duration_total_minutes} onChange={props.onChange} min="1" className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200" style={fieldStyle(Boolean(props.errors.duration_total_minutes))} required /></div>
          {props.errors.duration_total_minutes ? <p className="mt-1 text-xs" style={{ color: theme.dangerColor }}>{props.errors.duration_total_minutes}</p> : null}
        </div>
      </div>
    </motion.div>
  )
}
