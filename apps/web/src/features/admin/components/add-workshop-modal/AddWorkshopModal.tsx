'use client'

import {
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  LinkIcon,
  PhotoIcon,
  PlusIcon,
  TagIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

import { ImageUploadCourse } from '../../../instructor/components/ImageUploadCourse'
import {
  AdminButton,
  AdminFormField,
  AdminInput,
  AdminModalShell,
  AdminSelect,
  AdminSurface,
  AdminTabs,
  AdminTextarea,
} from '../ui'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import { useAddWorkshopFormState } from './useAddWorkshopFormState'

interface AddWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<void>
}

type TabType = 'basic' | 'details' | 'media'

const tabs: Array<{ id: TabType; label: string; icon: typeof BookOpenIcon }> = [
  { id: 'basic', label: 'Basica', icon: BookOpenIcon },
  { id: 'details', label: 'Detalles', icon: TagIcon },
  { id: 'media', label: 'Media', icon: PhotoIcon },
]

export function AddWorkshopModal({ isOpen, onClose, onSave }: AddWorkshopModalProps) {
  const theme = useAdminTheme()
  const {
    activeTab,
    error,
    errors,
    formData,
    handleChange,
    handleSubmit,
    instructors,
    isLoading,
    setActiveTab,
    setFormData,
  } = useAddWorkshopFormState({ isOpen, onSave, onClose })

  return (
    <AdminModalShell
      className="max-w-4xl"
      description="Agrega un nuevo taller a la plataforma"
      icon={PlusIcon}
      isOpen={isOpen}
      onClose={onClose}
      title="Crear nuevo taller"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <AdminButton disabled={isLoading} onClick={onClose} variant="secondary">
            Cancelar
          </AdminButton>
          <AdminButton disabled={isLoading} form="admin-add-workshop-form" icon={PlusIcon} type="submit">
            {isLoading ? 'Creando...' : 'Crear taller'}
          </AdminButton>
        </div>
      }
    >
      <form id="admin-add-workshop-form" onSubmit={handleSubmit} className="space-y-5">
        <AdminTabs
          tabs={tabs.map((tab) => ({ icon: tab.icon, label: tab.label, value: tab.id }))}
          value={activeTab}
          onChange={setActiveTab}
        />

        {error ? (
          <AdminSurface className="p-4" style={{ backgroundColor: theme.dangerSurface, borderColor: theme.dangerSurface }}>
            <p className="text-sm font-medium" style={{ color: theme.danger }}>
              {error}
            </p>
          </AdminSurface>
        ) : null}

        {activeTab === 'basic' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminFormField className="md:col-span-2" error={errors.title} label="Titulo del taller *">
              <div className="relative">
                <BookOpenIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
                <AdminInput
                  className="pl-10"
                  name="title"
                  onChange={handleChange}
                  placeholder="Ej: Introduccion a la Inteligencia Artificial"
                  required
                  type="text"
                  value={formData.title}
                />
              </div>
            </AdminFormField>

            <AdminFormField error={errors.instructor_id} label="Instructor *">
              <div className="relative">
                <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
                <AdminSelect
                  className="pl-10"
                  name="instructor_id"
                  onChange={handleChange}
                  required
                  value={formData.instructor_id}
                >
                  <option value="">Seleccionar instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </AdminSelect>
              </div>
            </AdminFormField>

            <AdminFormField error={errors.duration_total_minutes} label="Duracion (minutos) *">
              <div className="relative">
                <ClockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
                <AdminInput
                  className="pl-10"
                  min="1"
                  name="duration_total_minutes"
                  onChange={handleChange}
                  required
                  type="number"
                  value={formData.duration_total_minutes}
                />
              </div>
            </AdminFormField>

            <AdminFormField className="md:col-span-2" error={errors.description} label="Descripcion *">
              <AdminTextarea
                name="description"
                onChange={handleChange}
                placeholder="Describe el contenido y objetivos del taller..."
                required
                rows={4}
                value={formData.description}
              />
            </AdminFormField>
          </div>
        ) : null}

        {activeTab === 'details' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminFormField label="Categoria *">
              <AdminSelect name="category" onChange={handleChange} value={formData.category}>
                <option value="ia">Inteligencia Artificial</option>
                <option value="tecnologia">Tecnologia</option>
                <option value="negocios">Negocios</option>
                <option value="diseno">Diseno</option>
                <option value="marketing">Marketing</option>
              </AdminSelect>
            </AdminFormField>

            <AdminFormField label="Nivel *">
              <AdminSelect name="level" onChange={handleChange} value={formData.level}>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </AdminSelect>
            </AdminFormField>

            <AdminFormField label="Precio">
              <div className="relative">
                <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
                <AdminInput
                  className="pl-10"
                  min="0"
                  name="price"
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={formData.price}
                />
              </div>
            </AdminFormField>

            <AdminFormField error={errors.slug} label="Slug (URL amigable) *">
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
                <AdminInput
                  className="pl-10"
                  name="slug"
                  onChange={handleChange}
                  placeholder="introduccion-ia"
                  required
                  type="text"
                  value={formData.slug}
                />
              </div>
            </AdminFormField>

            <AdminSurface className="md:col-span-2 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  checked={formData.is_active}
                  className="sr-only"
                  name="is_active"
                  onChange={handleChange}
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
                    Taller activo
                  </span>
                  <span className="block text-xs" style={{ color: theme.textMuted }}>
                    El taller sera visible para los estudiantes
                  </span>
                </span>
              </label>
            </AdminSurface>
          </div>
        ) : null}

        {activeTab === 'media' ? (
          <AdminFormField label="Imagen del taller">
            <ImageUploadCourse
              disabled={isLoading}
              onChange={(url) => setFormData((prev) => ({ ...prev, thumbnail_url: url }))}
              value={formData.thumbnail_url}
            />
          </AdminFormField>
        ) : null}
      </form>
    </AdminModalShell>
  )
}
