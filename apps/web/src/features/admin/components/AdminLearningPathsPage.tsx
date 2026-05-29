'use client'

import Link from 'next/link'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageShell } from '@/core/layout'
import { ConfirmationModal } from './ConfirmationModal'
import { useAdminLearningPaths } from '../hooks'
import type { LearningPath } from '../types'

type FormState = {
  title: string
  slug: string
  description: string
}

interface AutoGrowingTextareaProps {
  className?: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

const TEXTAREA_MAX_HEIGHT_PX = 192

function AutoGrowingTextarea({
  className = '',
  onChange,
  placeholder,
  value,
}: AutoGrowingTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const syncTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const nextHeight = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY =
      textarea.scrollHeight > TEXTAREA_MAX_HEIGHT_PX ? 'auto' : 'hidden'
  }

  useLayoutEffect(() => {
    syncTextareaHeight()
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`max-h-48 min-h-32 resize-none overflow-y-hidden ${className}`}
      placeholder={placeholder}
    />
  )
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

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
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
    <PageShell spacing="relaxed">
      <section className="space-y-8">
        <header className="overflow-hidden rounded-3xl border border-white/10 bg-gray-900 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                {lp('badge', 'Rutas de aprendizaje')}
              </p>
              <h1 className="break-words text-3xl font-bold">
                {lp('listTitle', 'Secuencias administrables de talleres')}
              </h1>
              <p className="max-w-3xl break-words text-sm text-white/70">
                {lp(
                  'heroDescription',
                  'Crea rutas ordenadas de talleres y administra su secuencia desde este panel.',
                )}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-[18rem]">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="break-words text-[11px] uppercase tracking-[0.16em] text-white/50">
                  {lp('statsTotal', 'Total')}
                </p>
                <p className="mt-2 text-2xl font-bold">{learningPaths.length}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="break-words text-[11px] uppercase tracking-[0.16em] text-white/50">
                  {lp('statsActive', 'Activos')}
                </p>
                <p className="mt-2 text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <form
            onSubmit={handleCreate}
            className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {lp('createTitle', 'Crear ruta de aprendizaje')}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
                {lp('createDescription', 'Empieza con metadatos mínimos; el orden se administra en el detalle.')}
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                {lp('titleLabel', 'Título')}
              </span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder={lp('titlePlaceholder', 'Ruta de onboarding comercial')}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                {lp('slugLabel', 'Slug')}
              </span>
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder={lp('slugPlaceholder', 'ruta-onboarding-comercial')}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                {lp('descriptionLabel', 'Descripción')}
              </span>
              <AutoGrowingTextarea
                value={form.description}
                onChange={(description) =>
                  setForm((current) => ({ ...current, description }))
                }
                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                placeholder={lp('descriptionPlaceholder', 'Qué objetivo cubre esta ruta y a quién está dirigida.')}
              />
            </label>

            {submitError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? lp('creating', 'Creando...')
                : lp('createButton', 'Crear ruta de aprendizaje')}
            </button>
          </form>

          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {lp('existingTitle', 'Rutas de aprendizaje existentes')}
                </h2>
                <p className="mt-1 break-words text-sm text-slate-500 dark:text-white/60">
                  {lp('existingDescription', 'Administra metadatos, estado activo y contenido ordenado.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void reload()}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 sm:w-auto"
              >
                {lp('reload', 'Recargar')}
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-white/60">
                {lp('loading', 'Cargando rutas de aprendizaje...')}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : learningPaths.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-white/60">
                {lp('empty', 'Todavía no hay rutas de aprendizaje creadas.')}
              </div>
            ) : (
              <div className="space-y-4">
                {learningPaths.map((learningPath) => (
                  <article
                    key={learningPath.id}
                    className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="flex min-w-0 flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 break-words text-lg font-semibold text-slate-900 dark:text-white">
                            {learningPath.title}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              learningPath.is_active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/60'
                            }`}
                          >
                            {learningPath.is_active
                              ? lp('active', 'Activo')
                              : lp('inactive', 'Inactivo')}
                          </span>
                        </div>

                        <p className="break-words text-sm text-slate-500 dark:text-white/60">
                          {learningPath.description || lp('noDescription', 'Sin descripción')}
                        </p>
                        <div className="flex min-w-0 flex-wrap gap-3 text-xs text-slate-500 dark:text-white/50">
                          <span>
                            {lp('workshopsCount', '{{count}} talleres', {
                              count: learningPath.item_count,
                            })}
                          </span>
                          <span className="min-w-0 break-all">
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

                      <div className="flex flex-wrap gap-2 2xl:shrink-0">
                        <Link
                          href={`/admin/learning-paths/${learningPath.id}`}
                          className="whitespace-nowrap rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                        >
                          {lp('manageContent', 'Gestionar contenido')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(learningPath.id, learningPath.is_active)}
                          className="whitespace-nowrap rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                        >
                          {learningPath.is_active
                            ? lp('deactivate', 'Desactivar')
                            : lp('activate', 'Activar')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(learningPath)}
                          className="whitespace-nowrap rounded-2xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          {lp('delete', 'Eliminar')}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </section>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmedDelete()}
        title={lp('deleteTitle', 'Eliminar ruta de aprendizaje')}
        message={lp('deleteMessage', 'Se eliminará "{{title}}" y dejará de estar disponible para nuevas asignaciones. El progreso histórico se conserva.', {
          title: deleteTarget?.title || '',
        })}
        confirmText={lp('deleteConfirm', 'Eliminar')}
        type="danger"
        isLoading={Boolean(deletingId)}
      />
    </PageShell>
  )
}
