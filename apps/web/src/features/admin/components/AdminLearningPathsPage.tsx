'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { ListChecks, Plus, Power, RefreshCw, Route, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ConfirmationModal } from './ConfirmationModal'
import { useAdminLearningPaths } from '../hooks'
import type { LearningPath } from '../types'
import {
  AdminButton,
  AdminFormField,
  AdminInput,
  AdminLinkButton,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
  AdminTextarea,
} from './ui'

type FormState = {
  title: string
  slug: string
  description: string
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  description: '',
}

export function AdminLearningPathsPage() {
  const { t } = useTranslation('admin')
  const { learningPaths, loading, error, reload } = useAdminLearningPaths()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LearningPath | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const lp = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    t(`learningPathsPage.${key}`, { defaultValue, ...(options || {}) })

  const activeCount = useMemo(
    () => learningPaths.filter((path) => path.is_active).length,
    [learningPaths],
  )

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/admin/learning-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            lp('createError', 'No se pudo crear la ruta de aprendizaje'),
        )
      }

      setForm(EMPTY_FORM)
      await reload()
    } catch (createError) {
      setSubmitError(
        createError instanceof Error
          ? createError.message
          : lp('createError', 'No se pudo crear la ruta de aprendizaje'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const response = await fetch(`/api/admin/learning-paths/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          lp('updateError', 'No se pudo actualizar la ruta de aprendizaje'),
      )
    }

    await reload()
  }

  async function handleConfirmedDelete() {
    if (!deleteTarget) return

    setDeletingId(deleteTarget.id)
    try {
      const response = await fetch(`/api/admin/learning-paths/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            lp('deleteError', 'No se pudo eliminar la ruta de aprendizaje'),
        )
      }

      setDeleteTarget(null)
      await reload()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminPageShell maxWidth="content">
      <div className="space-y-7">
        <AdminSectionHeader
          size="page"
          icon={Route}
          kicker={lp('badge', 'Rutas de aprendizaje')}
          title={lp('listTitle', 'Secuencias administrables de talleres')}
          description={lp('heroDescription', 'Crea rutas ordenadas de talleres y administra su secuencia desde este panel.')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminMetricCard
            label={lp('statsTotal', 'Total')}
            value={learningPaths.length}
            icon={ListChecks}
            tone="primary"
          />
          <AdminMetricCard
            label={lp('statsActive', 'Activos')}
            value={activeCount}
            icon={Power}
            tone="info"
          />
        </div>

        <section className="grid gap-7 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <AdminSurface className="p-5">
            <form onSubmit={handleCreate} className="space-y-4">
              <AdminSectionHeader
                size="compact"
                title={lp('createTitle', 'Crear ruta de aprendizaje')}
                description={lp('createDescription', 'Empieza con metadatos minimos; el orden se administra en el detalle.')}
                className="mb-2"
              />

              <AdminFormField label={lp('titleLabel', 'Titulo')}>
                <AdminInput
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder={lp('titlePlaceholder', 'Ruta de onboarding comercial')}
                  required
                />
              </AdminFormField>

              <AdminFormField label={lp('slugLabel', 'Slug')}>
                <AdminInput
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  placeholder={lp('slugPlaceholder', 'ruta-onboarding-comercial')}
                />
              </AdminFormField>

              <AdminFormField label={lp('descriptionLabel', 'Descripcion')}>
                <AdminTextarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder={lp('descriptionPlaceholder', 'Que objetivo cubre esta ruta y a quien esta dirigida.')}
                  className="min-h-28"
                />
              </AdminFormField>

              {submitError ? (
                <AdminStatusBadge tone="danger" className="w-full justify-center rounded-xl">
                  {submitError}
                </AdminStatusBadge>
              ) : null}

              <AdminButton
                type="submit"
                disabled={submitting}
                icon={Plus}
                className="w-full"
              >
                {submitting
                  ? lp('creating', 'Creando...')
                  : lp('createButton', 'Crear ruta de aprendizaje')}
              </AdminButton>
            </form>
          </AdminSurface>

          <AdminSurface className="p-5">
            <AdminSectionHeader
              size="compact"
              title={lp('existingTitle', 'Rutas de aprendizaje existentes')}
              description={lp('existingDescription', 'Administra metadatos, estado activo y contenido ordenado.')}
              actions={(
                <AdminButton
                  type="button"
                  icon={RefreshCw}
                  onClick={() => void reload()}
                  variant="secondary"
                  size="sm"
                >
                  {lp('reload', 'Recargar')}
                </AdminButton>
              )}
            />

            {loading ? (
              <AdminSurface className="border-dashed p-8 text-center text-sm">
                {lp('loading', 'Cargando rutas de aprendizaje...')}
              </AdminSurface>
            ) : error ? (
              <AdminStatusBadge tone="danger" className="w-full justify-center rounded-xl">
                {error}
              </AdminStatusBadge>
            ) : learningPaths.length === 0 ? (
              <AdminSurface className="border-dashed p-8 text-center text-sm">
                {lp('empty', 'Todavia no hay rutas de aprendizaje creadas.')}
              </AdminSurface>
            ) : (
              <div className="space-y-4">
                {learningPaths.map((learningPath) => (
                  <AdminSurface key={learningPath.id} className="p-4" interactive>
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold">
                            {learningPath.title}
                          </h3>
                          <AdminStatusBadge tone={learningPath.is_active ? 'primary' : 'neutral'}>
                            {learningPath.is_active
                              ? lp('active', 'Activo')
                              : lp('inactive', 'Inactivo')}
                          </AdminStatusBadge>
                        </div>

                        <p className="break-words text-sm opacity-75">
                          {learningPath.description || lp('noDescription', 'Sin descripcion')}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs opacity-65">
                          <span>
                            {lp('workshopsCount', '{{count}} talleres', {
                              count: learningPath.item_count,
                            })}
                          </span>
                          <span>
                            {lp('slugValue', 'Slug: {{slug}}', {
                              slug: learningPath.slug || lp('autoSlug', 'auto'),
                            })}
                          </span>
                          <span>
                            {lp('updatedAt', 'Actualizado: {{date}}', {
                              date: new Date(learningPath.updated_at).toLocaleDateString(),
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:shrink-0">
                        <AdminLinkButton
                          href={`/admin/learning-paths/${learningPath.id}`}
                          variant="secondary"
                          size="sm"
                        >
                          {lp('manageContent', 'Gestionar contenido')}
                        </AdminLinkButton>
                        <AdminButton
                          type="button"
                          onClick={() => void handleToggleActive(learningPath.id, learningPath.is_active)}
                          variant="secondary"
                          size="sm"
                        >
                          {learningPath.is_active
                            ? lp('deactivate', 'Desactivar')
                            : lp('activate', 'Activar')}
                        </AdminButton>
                        <AdminButton
                          type="button"
                          onClick={() => setDeleteTarget(learningPath)}
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                        >
                          {lp('delete', 'Eliminar')}
                        </AdminButton>
                      </div>
                    </div>
                  </AdminSurface>
                ))}
              </div>
            )}
          </AdminSurface>
        </section>
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmedDelete()}
        title={lp('deleteTitle', 'Eliminar ruta de aprendizaje')}
        message={lp('deleteMessage', 'Se eliminara "{{title}}" y dejara de estar disponible para nuevas asignaciones. El progreso historico se conserva.', {
          title: deleteTarget?.title || '',
        })}
        confirmText={lp('deleteConfirm', 'Eliminar')}
        type="danger"
        isLoading={Boolean(deletingId)}
      />
    </AdminPageShell>
  )
}
