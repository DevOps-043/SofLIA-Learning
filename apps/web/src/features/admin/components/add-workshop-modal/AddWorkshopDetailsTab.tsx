'use client'

import { CheckCircle, DollarSign, Link } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { ChangeEventHandler } from 'react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { ADD_WORKSHOP_CATEGORY_OPTIONS, ADD_WORKSHOP_LEVEL_OPTIONS } from './service'

interface AddWorkshopDetailsTabProps {
  formData: { category: string; level: string; price: number | string; slug: string; is_active: boolean }
  errors: Record<string, string>
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement>
}

export function AddWorkshopDetailsTab(props: AddWorkshopDetailsTabProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const fieldStyle = (hasError = false) => ({ backgroundColor: theme.inputBg, borderColor: hasError ? theme.dangerColor : theme.borderColor, color: theme.textColor })
  const labelStyle = { color: theme.mutedTextColor }
  const iconStyle = { color: theme.subtextColor }
  return (
    <motion.div key="details" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.categoryLabel')}</label><select name="category" value={props.formData.category} onChange={props.onChange} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={fieldStyle()}>{ADD_WORKSHOP_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{t(`workshops.filters.categories.${category}`)}</option>)}</select></div>
        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.levelLabel')}</label><select name="level" value={props.formData.level} onChange={props.onChange} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={fieldStyle()}>{ADD_WORKSHOP_LEVEL_OPTIONS.map((level) => <option key={level} value={level}>{t(`workshops.card.level.${level}`)}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="group"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.priceLabel')}</label><div className="relative"><DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={iconStyle} /><input type="number" name="price" value={props.formData.price} onChange={props.onChange} min="0" step="0.01" className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200" style={fieldStyle()} placeholder="0.00" /></div></div>
        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={labelStyle}>{t('workshops.editor.config.slugLabel')}</label><div className="relative"><Link className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={iconStyle} /><input type="text" name="slug" value={props.formData.slug} onChange={props.onChange} className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200" style={fieldStyle(Boolean(props.errors.slug))} placeholder={t('workshops.addModal.slugPlaceholder')} required /></div>{props.errors.slug ? <p className="mt-1 text-xs" style={{ color: theme.dangerColor }}>{props.errors.slug}</p> : null}</div>
      </div>
      <motion.div whileHover={{ scale: 1.01 }} className="rounded-xl border p-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative"><input type="checkbox" name="is_active" checked={props.formData.is_active} onChange={props.onChange} className="sr-only" /><motion.div animate={{ backgroundColor: props.formData.is_active ? theme.accentColor : theme.inputBg, borderColor: props.formData.is_active ? theme.accentColor : theme.borderColor }} className="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors duration-200">{props.formData.is_active ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}><CheckCircle className="h-4 w-4" style={{ color: theme.onPrimaryColor }} /></motion.div> : null}</motion.div></div>
          <div><span className="text-sm font-semibold" style={{ color: theme.textColor }}>{t('workshops.addModal.activeTitle')}</span><p className="mt-0.5 text-xs" style={{ color: theme.subtextColor }}>{t('workshops.addModal.activeDescription')}</p></div>
        </label>
      </motion.div>
    </motion.div>
  )
}
