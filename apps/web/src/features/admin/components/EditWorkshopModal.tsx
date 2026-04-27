'use client'

import { useEffect, useState } from 'react'
import {
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

import type { AdminWorkshop } from '../services/adminWorkshops.service'
import {
  AdminButton,
  AdminFormField,
  AdminInput,
  AdminModalShell,
  AdminSelect,
  AdminStatusBadge,
  AdminSurface,
  AdminTabs,
  AdminTextarea,
} from './ui'
import { useAdminTheme } from '../hooks/useAdminTheme'

interface EditWorkshopModalProps {
  workshop: AdminWorkshop | null
  onClose: () => void
  onSave: (data: Partial<AdminWorkshop>) => Promise<void>
}

type TabType = 'basic' | 'status'
type ApprovalStatus = NonNullable<AdminWorkshop['approval_status']>

const categories = [
  { value: 'ia', label: 'Inteligencia Artificial' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'negocios', label: 'Negocios' },
  { value: 'diseno', label: 'Diseno' },
  { value: 'marketing', label: 'Marketing' },
]

const levels = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]

const approvalStatuses: Array<{
  value: ApprovalStatus
  label: string
  icon: typeof ExclamationTriangleIcon
  tone: 'warning' | 'success' | 'danger'
}> = [
  { value: 'pending', label: 'Pendiente', icon: ExclamationTriangleIcon, tone: 'warning' },
  { value: 'approved', label: 'Aprobado', icon: CheckCircleIcon, tone: 'success' },
  { value: 'rejected', label: 'Rechazado', icon: XCircleIcon, tone: 'danger' },
]

const tabs: Array<{ id: TabType; label: string; icon: typeof BookOpenIcon }> = [
  { id: 'basic', label: 'Informacion', icon: BookOpenIcon },
  { id: 'status', label: 'Estado', icon: ShieldCheckIcon },
]

export function EditWorkshopModal({ workshop, onClose, onSave }: EditWorkshopModalProps) {
  const theme = useAdminTheme()
  const [formData, setFormData] = useState<Partial<AdminWorkshop>>({
    approval_status: 'pending',
    category: 'ia',
    description: '',
    duration_total_minutes: 0,
    is_active: true,
    level: 'beginner',
    price: 0,
    rejection_reason: '',
    title: '',
  })
  const [activeTab, setActiveTab] = useState<TabType>('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!workshop) return

    setFormData({
      approval_status: workshop.approval_status || 'pending',
      category: workshop.category || 'ia',
      description: workshop.description || '',
      duration_total_minutes: workshop.duration_total_minutes || 0,
      is_active: workshop.is_active !== undefined ? workshop.is_active : true,
      level: workshop.level || 'beginner',
      price: workshop.price || 0,
      rejection_reason: workshop.rejection_reason || '',
      title: workshop.title || '',
    })
    setActiveTab('basic')
    setErrors({})
    setSaveError(null)
  }, [workshop])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = 'El titulo es obligatorio'
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'La descripcion es obligatoria'
    }

    if (!formData.duration_total_minutes || formData.duration_total_minutes <= 0) {
      newErrors.duration_total_minutes = 'La duracion debe ser mayor a 0'
    }

    if (formData.approval_status === 'rejected' && !formData.rejection_reason?.trim()) {
      newErrors.rejection_reason = 'La razon de rechazo es obligatoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setSaveError(null)

    try {
      const dataToSave = { ...formData }
      if (formData.approval_status !== 'rejected') {
        dataToSave.rejection_reason = ''
      }

      await onSave(dataToSave)
      onClose()
    } catch {
      setSaveError('Error al actualizar el taller')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = <K extends keyof AdminWorkshop>(field: K, value: AdminWorkshop[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev }
        delete nextErrors[field]
        return nextErrors
      })
    }
  }

  if (!workshop) return null

  const currentApprovalStatus =
    approvalStatuses.find((status) => status.value === formData.approval_status) || approvalStatuses[0]
  const CurrentStatusIcon = currentApprovalStatus.icon

  return (
    <AdminModalShell
      className="max-w-4xl"
      description={workshop.title}
      icon={BookOpenIcon}
      isOpen={Boolean(workshop)}
      onClose={onClose}
      title="Editar taller"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {saveError ? (
            <p className="text-sm font-medium" style={{ color: theme.danger }}>
              {saveError}
            </p>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <AdminButton disabled={loading} onClick={onClose} variant="secondary">
              Cancelar
            </AdminButton>
            <AdminButton disabled={loading} form="admin-edit-workshop-form" icon={CheckCircleIcon} type="submit">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </AdminButton>
          </div>
        </div>
      }
    >
      <form id="admin-edit-workshop-form" onSubmit={handleSubmit} className="space-y-5">
        <AdminTabs
          tabs={tabs.map((tab) => ({ icon: tab.icon, label: tab.label, value: tab.id }))}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'basic' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminFormField className="md:col-span-2" error={errors.title} label="Titulo *">
              <AdminInput
                onChange={(event) => handleInputChange('title', event.target.value)}
                placeholder="Titulo del taller"
                type="text"
                value={formData.title || ''}
              />
            </AdminFormField>

            <AdminFormField className="md:col-span-2" error={errors.description} label="Descripcion *">
              <AdminTextarea
                onChange={(event) => handleInputChange('description', event.target.value)}
                placeholder="Descripcion del taller"
                rows={4}
                value={formData.description || ''}
              />
            </AdminFormField>

            <AdminFormField label="Categoria *">
              <AdminSelect
                onChange={(event) => handleInputChange('category', event.target.value)}
                value={formData.category || 'ia'}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </AdminSelect>
            </AdminFormField>

            <AdminFormField label="Nivel *">
              <AdminSelect
                onChange={(event) => handleInputChange('level', event.target.value)}
                value={formData.level || 'beginner'}
              >
                {levels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </AdminSelect>
            </AdminFormField>

            <AdminFormField error={errors.duration_total_minutes} label="Duracion (minutos) *">
              <AdminInput
                min="0"
                onChange={(event) => handleInputChange('duration_total_minutes', Number.parseInt(event.target.value, 10) || 0)}
                type="number"
                value={formData.duration_total_minutes || 0}
              />
            </AdminFormField>

            <AdminFormField label="Precio">
              <AdminInput
                min="0"
                onChange={(event) => handleInputChange('price', Number.parseFloat(event.target.value) || 0)}
                step="0.01"
                type="number"
                value={formData.price || 0}
              />
            </AdminFormField>
          </div>
        ) : null}

        {activeTab === 'status' ? (
          <div className="space-y-4">
            <AdminSurface className="p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  checked={Boolean(formData.is_active)}
                  className="sr-only"
                  onChange={(event) => handleInputChange('is_active', event.target.checked)}
                  type="checkbox"
                />
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-md border-2"
                  style={{
                    backgroundColor: formData.is_active ? theme.accent : theme.surfaceSubtle,
                    borderColor: formData.is_active ? theme.accent : theme.border,
                    color: theme.inverseText,
                  }}
                >
                  {formData.is_active ? <CheckCircleIcon className="h-4 w-4" /> : null}
                </span>
                <span>
                  <span className="block text-sm font-semibold" style={{ color: theme.text }}>
                    {formData.is_active ? 'Taller activo' : 'Taller inactivo'}
                  </span>
                  <span className="block text-xs" style={{ color: theme.textMuted }}>
                    {formData.is_active ? 'El taller es visible para estudiantes' : 'El taller esta oculto'}
                  </span>
                </span>
              </label>
            </AdminSurface>

            <AdminFormField label="Estado de aprobacion *">
              <AdminSelect
                onChange={(event) => handleInputChange('approval_status', event.target.value as ApprovalStatus)}
                value={formData.approval_status || 'pending'}
              >
                {approvalStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </AdminSelect>
              <div className="mt-2">
                <AdminStatusBadge tone={currentApprovalStatus.tone}>
                  <CurrentStatusIcon className="h-4 w-4" />
                  {currentApprovalStatus.label}
                </AdminStatusBadge>
              </div>
            </AdminFormField>

            {formData.approval_status === 'rejected' ? (
              <AdminFormField
                error={errors.rejection_reason}
                help="La razon de rechazo es obligatoria cuando el estado es Rechazado."
                label="Razon de rechazo *"
              >
                <AdminTextarea
                  onChange={(event) => handleInputChange('rejection_reason', event.target.value)}
                  placeholder="Explica por que se rechaza este taller..."
                  rows={3}
                  value={formData.rejection_reason || ''}
                />
              </AdminFormField>
            ) : null}

            {formData.approval_status === 'approved' && workshop.approved_at ? (
              <AdminSurface className="p-4" style={{ backgroundColor: theme.successSurface, borderColor: theme.successSurface }}>
                <p className="text-sm font-semibold" style={{ color: theme.success }}>
                  Aprobado el: {new Date(workshop.approved_at).toLocaleString('es-ES')}
                </p>
                {workshop.approved_by ? (
                  <p className="mt-1 text-xs" style={{ color: theme.success }}>
                    Por: {workshop.approved_by}
                  </p>
                ) : null}
              </AdminSurface>
            ) : null}
          </div>
        ) : null}
      </form>
    </AdminModalShell>
  )
}
