import { AlertTriangle, BookOpen, CheckCircle, ShieldCheck, XCircle } from 'lucide-react'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'
import type { EditWorkshopStatusOption, EditWorkshopTabItem, EditWorkshopTheme } from './types'

export const EDIT_WORKSHOP_CATEGORY_OPTIONS = ['ia', 'tecnologia', 'negocios', 'diseno', 'marketing']
export const EDIT_WORKSHOP_LEVEL_OPTIONS = ['beginner', 'intermediate', 'advanced']
export const EDIT_WORKSHOP_TABS: EditWorkshopTabItem[] = [
  { id: 'basic', labelKey: 'workshops.editModal.tabs.basic', icon: BookOpen },
  { id: 'status', labelKey: 'workshops.editModal.tabs.status', icon: ShieldCheck },
]

export function normalizeWorkshopCategory(category?: string | null) {
  return category === 'diseÃ±o' ? 'diseno' : category || 'ia'
}

export function getInitialEditWorkshopData(workshop: AdminWorkshop | null): Partial<AdminWorkshop> {
  return {
    title: workshop?.title || '',
    description: workshop?.description || '',
    category: normalizeWorkshopCategory(workshop?.category),
    level: workshop?.level || 'beginner',
    duration_total_minutes: workshop?.duration_total_minutes || 0,
    price: workshop?.price || 0,
    is_active: workshop?.is_active !== undefined ? workshop.is_active : true,
    approval_status: workshop?.approval_status || 'pending',
    rejection_reason: workshop?.rejection_reason || '',
  }
}

export function validateEditWorkshopForm(
  formData: Partial<AdminWorkshop>,
  t: (key: string) => string,
) {
  const errors: Record<string, string> = {}
  if (!formData.title || formData.title.trim() === '') errors.title = t('workshops.editModal.validation.titleRequired')
  if (!formData.description || formData.description.trim() === '') errors.description = t('workshops.editModal.validation.descriptionRequired')
  if (!formData.duration_total_minutes || formData.duration_total_minutes <= 0) errors.duration_total_minutes = t('workshops.editModal.validation.durationRequired')
  if (formData.approval_status === 'rejected' && (!formData.rejection_reason || formData.rejection_reason.trim() === '')) errors.rejection_reason = t('workshops.editModal.validation.rejectionReasonRequired')
  return errors
}

export function getEditWorkshopStatusOptions(theme: EditWorkshopTheme): EditWorkshopStatusOption[] {
  return [
    { value: 'pending', labelKey: 'workshops.editModal.approval.pending', icon: AlertTriangle, color: theme.warningColor },
    { value: 'approved', labelKey: 'workshops.editModal.approval.approved', icon: CheckCircle, color: theme.successColor },
    { value: 'rejected', labelKey: 'workshops.editModal.approval.rejected', icon: XCircle, color: theme.dangerColor },
  ]
}
