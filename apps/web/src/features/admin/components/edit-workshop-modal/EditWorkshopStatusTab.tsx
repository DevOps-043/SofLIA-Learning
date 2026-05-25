'use client'

import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { EditWorkshopFieldStyles, EditWorkshopStatusOption, EditWorkshopTheme } from './types'

interface EditWorkshopStatusTabProps {
  workshop: AdminWorkshop
  formData: Partial<AdminWorkshop>
  errors: Record<string, string>
  currentApprovalStatus: EditWorkshopStatusOption
  statusOptions: EditWorkshopStatusOption[]
  theme: EditWorkshopTheme
  styles: EditWorkshopFieldStyles
  onInputChange: <K extends keyof AdminWorkshop>(field: K, value: AdminWorkshop[K]) => void
}

export function EditWorkshopStatusTab(props: EditWorkshopStatusTabProps) {
  const { t } = useTranslation('admin')
  const ApprovalIcon = props.currentApprovalStatus.icon
  return (
    <div className="grid gap-5 p-6">
      <label className="flex items-start gap-4 rounded-2xl border p-4" style={{ backgroundColor: props.theme.inputBg, borderColor: props.theme.borderColor }}>
        <input type="checkbox" checked={Boolean(props.formData.is_active)} onChange={(event) => props.onInputChange('is_active', event.target.checked)} className="sr-only" />
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: props.formData.is_active ? `color-mix(in srgb, ${props.theme.successColor} 7.8%, transparent)` : `color-mix(in srgb, ${props.theme.warningColor} 7.8%, transparent)`, color: props.formData.is_active ? props.theme.successColor : props.theme.warningColor }}>
          <CheckCircle className="h-5 w-5" />
        </div>
        <div>
          <span className="text-sm font-semibold" style={{ color: props.theme.textColor }}>{props.formData.is_active ? t('workshops.editModal.activeTitle') : t('workshops.editModal.inactiveTitle')}</span>
          <p className="mt-0.5 text-xs" style={{ color: props.theme.subtextColor }}>{props.formData.is_active ? t('workshops.editModal.activeDescription') : t('workshops.editModal.inactiveDescription')}</p>
        </div>
      </label>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={props.styles.label}>{t('workshops.editModal.approvalStatusLabel')}</label>
        <select value={props.formData.approval_status} onChange={(event) => props.onInputChange('approval_status', event.target.value as AdminWorkshop['approval_status'])} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={props.styles.field()}>
          {props.statusOptions.map((status) => <option key={status.value} value={status.value}>{t(status.labelKey)}</option>)}
        </select>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5" style={{ backgroundColor: `color-mix(in srgb, ${props.currentApprovalStatus.color} 7.8%, transparent)`, borderColor: `color-mix(in srgb, ${props.currentApprovalStatus.color} 14.9%, transparent)`, color: props.currentApprovalStatus.color }}>
            <ApprovalIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">{t(props.currentApprovalStatus.labelKey)}</span>
          </div>
        </div>
      </div>
      {props.formData.approval_status === 'rejected' ? <RejectedReasonField formData={props.formData} error={props.errors.rejection_reason} styles={props.styles} onInputChange={props.onInputChange} /> : null}
      {props.formData.approval_status === 'approved' && props.workshop.approved_at ? <ApprovedInfo workshop={props.workshop} theme={props.theme} /> : null}
    </div>
  )
}

function RejectedReasonField(props: { formData: Partial<AdminWorkshop>; error?: string; styles: EditWorkshopFieldStyles; onInputChange: <K extends keyof AdminWorkshop>(field: K, value: AdminWorkshop[K]) => void }) {
  const { t } = useTranslation('admin')
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={props.styles.label}>{t('workshops.editModal.rejectionReasonLabel')}</label>
      <textarea value={props.formData.rejection_reason || ''} onChange={(event) => props.onInputChange('rejection_reason', event.target.value)} rows={3} className="w-full resize-none rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200" style={props.styles.field(Boolean(props.error))} placeholder={t('workshops.editModal.rejectionReasonPlaceholder')} />
      {props.error ? <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}><AlertTriangle className="h-3 w-3" />{props.error}</p> : <p className="mt-1 text-xs" style={props.styles.label}>{t('workshops.editModal.rejectionReasonHelp')}</p>}
    </div>
  )
}

function ApprovedInfo(props: { workshop: AdminWorkshop; theme: EditWorkshopTheme }) {
  const { t } = useTranslation('admin')
  return (
    <div className="rounded-xl border p-4" style={{ backgroundColor: `color-mix(in srgb, ${props.theme.successColor} 7.8%, transparent)`, borderColor: `color-mix(in srgb, ${props.theme.successColor} 14.9%, transparent)` }}>
      <p className="text-sm" style={{ color: props.theme.successColor }}><strong>{t('workshops.editModal.approvedAt')}:</strong> {new Date(props.workshop.approved_at as string).toLocaleString()}</p>
      {props.workshop.approved_by ? <p className="mt-1 text-xs" style={{ color: props.theme.successColor }}>{t('workshops.editModal.approvedBy')}: {props.workshop.approved_by}</p> : null}
    </div>
  )
}
