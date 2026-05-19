'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, Clock, DollarSign, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { EditWorkshopFieldStyles } from './types'
import { EDIT_WORKSHOP_CATEGORY_OPTIONS, EDIT_WORKSHOP_LEVEL_OPTIONS } from './service'

interface EditWorkshopBasicTabProps {
  formData: Partial<AdminWorkshop>
  errors: Record<string, string>
  styles: EditWorkshopFieldStyles
  onInputChange: <K extends keyof AdminWorkshop>(field: K, value: AdminWorkshop[K]) => void
}

export function EditWorkshopBasicTab(props: EditWorkshopBasicTabProps) {
  const { t } = useTranslation('admin')
  return (
    <div className="grid gap-5 p-6">
      <EditWorkshopTextField label={t('workshops.editor.config.titleLabel')} value={props.formData.title || ''} onChange={(value) => props.onInputChange('title', value)} error={props.errors.title} styles={props.styles} />
      <EditWorkshopTextAreaField label={t('workshops.editor.config.descriptionLabel')} value={props.formData.description || ''} onChange={(value) => props.onInputChange('description', value)} error={props.errors.description} styles={props.styles} />
      <div className="grid gap-5 md:grid-cols-2">
        <EditWorkshopSelectField label={t('workshops.editor.config.categoryLabel')} value={props.formData.category || 'ia'} onChange={(value) => props.onInputChange('category', value)} options={EDIT_WORKSHOP_CATEGORY_OPTIONS} optionLabel={(value) => t(`common.categories.${value}`)} styles={props.styles} />
        <EditWorkshopSelectField label={t('workshops.editor.config.levelLabel')} value={props.formData.level || 'beginner'} onChange={(value) => props.onInputChange('level', value)} options={EDIT_WORKSHOP_LEVEL_OPTIONS} optionLabel={(value) => t(`workshops.card.level.${value}`)} styles={props.styles} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <EditWorkshopNumberField label={t('workshops.editor.config.durationLabel')} value={props.formData.duration_total_minutes || 0} onChange={(value) => props.onInputChange('duration_total_minutes', value as number)} icon={Clock} error={props.errors.duration_total_minutes} styles={props.styles} />
        <EditWorkshopNumberField label={t('workshops.editor.config.priceLabel')} value={props.formData.price || 0} onChange={(value) => props.onInputChange('price', value as number)} icon={DollarSign} styles={props.styles} />
      </div>
    </div>
  )
}

function EditWorkshopTextField(props: { label: string; value: string; onChange: (value: string) => void; error?: string; styles: EditWorkshopFieldStyles }) {
  return <FieldShell label={props.label} error={props.error} styles={props.styles}><input value={props.value} onChange={(event) => props.onChange(event.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={props.styles.field(Boolean(props.error))} /></FieldShell>
}

function EditWorkshopTextAreaField(props: { label: string; value: string; onChange: (value: string) => void; error?: string; styles: EditWorkshopFieldStyles }) {
  return <FieldShell label={props.label} error={props.error} styles={props.styles}><textarea value={props.value} onChange={(event) => props.onChange(event.target.value)} rows={4} className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={props.styles.field(Boolean(props.error))} /></FieldShell>
}

function EditWorkshopSelectField(props: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; optionLabel: (value: string) => string; styles: EditWorkshopFieldStyles }) {
  return <FieldShell label={props.label} styles={props.styles}><select value={props.value} onChange={(event) => props.onChange(event.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={props.styles.field()}>{props.options.map((option) => <option key={option} value={option}>{props.optionLabel(option)}</option>)}</select></FieldShell>
}

function EditWorkshopNumberField(props: { label: string; value: number; onChange: (value: number) => void; icon: typeof Tag; error?: string; styles: EditWorkshopFieldStyles }) {
  const Icon = props.icon
  return <FieldShell label={props.label} error={props.error} styles={props.styles}><div className="relative"><Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={props.styles.icon} /><input type="number" min="0" value={props.value} onChange={(event) => props.onChange(parseFloat(event.target.value) || 0)} className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200" style={props.styles.field(Boolean(props.error))} /></div></FieldShell>
}

function FieldShell(props: { label: string; children: ReactNode; error?: string; styles: EditWorkshopFieldStyles }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={props.styles.label}>{props.label}</label>
      {props.children}
      {props.error ? <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}><AlertTriangle className="h-3 w-3" />{props.error}</p> : null}
    </div>
  )
}
