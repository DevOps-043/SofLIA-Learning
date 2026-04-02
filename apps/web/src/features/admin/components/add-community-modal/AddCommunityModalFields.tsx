'use client'

import { BookOpen, Eye, EyeOff, Globe, Lock, Shield } from 'lucide-react'
import { ImageUpload } from '../ImageUpload'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import type {
  AddCommunityCourseOption,
  AddCommunityFormData,
  AddCommunityFormErrors,
} from './types'

const colors = SOFLIA_ADMIN_COLORS

interface AddCommunityModalFieldsProps {
  formData: AddCommunityFormData
  errors: AddCommunityFormErrors
  courses: AddCommunityCourseOption[]
  isLoadingCourses: boolean
  isSubmitting: boolean
  onFieldChange: <K extends keyof AddCommunityFormData>(
    field: K,
    value: AddCommunityFormData[K],
  ) => void
}

function FieldLabel({
  label,
  required,
}: {
  label: string
  required?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-gray-300">
      {label}
      {required ? <span style={{ color: colors.accent }}> *</span> : null}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-red-400">{message}</p>
}

export function AddCommunityModalFields({
  formData,
  errors,
  courses,
  isLoadingCourses,
  isSubmitting,
  onFieldChange,
}: AddCommunityModalFieldsProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-start gap-3">
          <div
            className="rounded-xl p-3"
            style={{ background: `${colors.accent}20`, color: colors.accent }}
          >
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">
              Informacion base
            </h4>
            <p className="text-sm text-gray-400">
              Define identidad, descripcion y slug publico de la comunidad.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <FieldLabel label="Nombre" required />
            <input
              value={formData.name}
              onChange={(event) => onFieldChange('name', event.target.value)}
              placeholder="Comunidad de IA Aplicada"
              className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3 text-white outline-none transition focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20"
              disabled={isSubmitting}
            />
            <FieldError message={errors.name} />
          </div>

          <div className="space-y-2">
            <FieldLabel label="Slug" required />
            <input
              value={formData.slug}
              onChange={(event) => onFieldChange('slug', event.target.value)}
              placeholder="comunidad-ia-aplicada"
              className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3 text-white outline-none transition focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20"
              disabled={isSubmitting}
            />
            <FieldError message={errors.slug} />
          </div>

          <div className="space-y-2">
            <FieldLabel label="Curso vinculado" />
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <select
                value={formData.course_id}
                onChange={(event) =>
                  onFieldChange('course_id', event.target.value)
                }
                disabled={isSubmitting || isLoadingCourses}
                className="w-full appearance-none rounded-xl border border-white/10 bg-[#0A0D12] py-3 pl-12 pr-4 text-white outline-none transition focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20"
              >
                <option value="">Sin curso vinculado</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                    {course.instructor_name
                      ? ` - ${course.instructor_name}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
            {isLoadingCourses ? (
              <p className="text-sm text-gray-500">Cargando cursos...</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel label="Descripcion" required />
          <textarea
            value={formData.description}
            onChange={(event) =>
              onFieldChange('description', event.target.value)
            }
            rows={4}
            placeholder="Describe el objetivo, tono y valor de la comunidad."
            className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3 text-white outline-none transition focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20"
            disabled={isSubmitting}
          />
          <FieldError message={errors.description} />
        </div>

        <div className="space-y-2">
          <FieldLabel label="Imagen" />
          <ImageUpload
            value={formData.image_url}
            onChange={(url) => onFieldChange('image_url', url)}
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div
              className="rounded-xl p-3"
              style={{ background: `${colors.purple}20`, color: colors.purple }}
            >
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">
                Privacidad y acceso
              </h4>
              <p className="text-sm text-gray-400">
                Controla visibilidad y reglas de entrada.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel label="Visibilidad" required />
            <select
              value={formData.visibility}
              onChange={(event) =>
                onFieldChange(
                  'visibility',
                  event.target.value as AddCommunityFormData['visibility'],
                )
              }
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/10 bg-[#0A0D12] px-4 py-3 text-white outline-none transition focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20"
            >
              <option value="public">Publica</option>
              <option value="private">Privada</option>
            </select>
          </div>

          <div className="space-y-2">
            <FieldLabel label="Tipo de acceso" required />
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <select
                value={formData.access_type}
                onChange={(event) =>
                  onFieldChange(
                    'access_type',
                    event.target.value as AddCommunityFormData['access_type'],
                  )
                }
                disabled={isSubmitting}
                className="w-full appearance-none rounded-xl border border-white/10 bg-[#0A0D12] py-3 pl-12 pr-4 text-white outline-none transition focus:border-[#00D4B3] focus:ring-2 focus:ring-[#00D4B3]/20"
              >
                <option value="open">Abierto</option>
                <option value="moderated">Moderado</option>
                <option value="invite_only">Solo invitacion</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start gap-3">
            <div
              className="rounded-xl p-3"
              style={{
                background: formData.is_active
                  ? `${colors.success}20`
                  : 'rgba(255,255,255,0.08)',
                color: formData.is_active ? colors.success : colors.grayMedium,
              }}
            >
              {formData.is_active ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Estado</h4>
              <p className="text-sm text-gray-400">
                Decide si la comunidad nace visible para usuarios.
              </p>
            </div>
          </div>

          <label
            className="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition"
            style={{
              borderColor: formData.is_active
                ? `${colors.success}40`
                : 'rgba(255,255,255,0.08)',
              background: formData.is_active
                ? `${colors.success}10`
                : 'rgba(255,255,255,0.03)',
            }}
          >
            <div>
              <p className="font-medium text-white">
                Comunidad {formData.is_active ? 'activa' : 'inactiva'}
              </p>
              <p className="text-sm text-gray-400">
                {formData.is_active
                  ? 'Visible para miembros y listados'
                  : 'Creada en estado oculto'}
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#00D4B3]"
              checked={formData.is_active}
              onChange={(event) =>
                onFieldChange('is_active', event.target.checked)
              }
              disabled={isSubmitting}
            />
          </label>
        </div>
      </section>
    </div>
  )
}
