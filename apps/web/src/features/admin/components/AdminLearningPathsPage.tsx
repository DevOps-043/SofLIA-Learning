'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { PageShell } from '@/core/layout'
import { useAdminLearningPaths } from '../hooks'

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
  const { learningPaths, loading, error, reload } = useAdminLearningPaths()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
        throw new Error(data.error || 'No se pudo crear el learning path')
      }

      setForm(EMPTY_FORM)
      await reload()
    } catch (createError) {
      setSubmitError(
        createError instanceof Error
          ? createError.message
          : 'No se pudo crear el learning path',
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
      throw new Error(data.error || 'No se pudo actualizar el learning path')
    }

    await reload()
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      '¿Eliminar este learning path? El progreso histórico se conservará, pero ya no estará disponible.',
    )
    if (!confirmed) return

    const response = await fetch(`/api/admin/learning-paths/${id}`, {
      method: 'DELETE',
    })
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'No se pudo eliminar el learning path')
    }

    await reload()
  }

  return (
    <PageShell spacing="relaxed">
      <section className="space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0F1419] p-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00D4B3]">
                Learning Paths
              </p>
              <h1 className="text-3xl font-bold">Secuencias administrables de talleres</h1>
              <p className="max-w-3xl text-sm text-white/70">
                Crea playlists ordenadas de talleres, reutiliza un mismo taller en distintos paths
                y prepara la asignación organizacional o individual sin tocar el dominio actual de cursos.
              </p>
            </div>

            <div className="grid min-w-[220px] grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Total</p>
                <p className="mt-2 text-2xl font-bold">{learningPaths.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">Activos</p>
                <p className="mt-2 text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-8 xl:grid-cols-[360px,1fr]">
          <form
            onSubmit={handleCreate}
            className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Crear learning path
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
                Empieza con metadatos mínimos; el orden y contenido se administra en el detalle.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-white/80">Título</span>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00D4B3] dark:border-white/10 dark:bg-[#0F172A] dark:text-white"
                placeholder="Ruta de onboarding comercial"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-white/80">Slug</span>
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00D4B3] dark:border-white/10 dark:bg-[#0F172A] dark:text-white"
                placeholder="ruta-onboarding-comercial"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-white/80">Descripción</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00D4B3] dark:border-white/10 dark:bg-[#0F172A] dark:text-white"
                placeholder="Qué objetivo cubre este learning path y a quién está dirigido."
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
              className="w-full rounded-2xl bg-[#00D4B3] px-4 py-3 text-sm font-semibold text-[#0A2540] transition hover:bg-[#18e3c4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creando...' : 'Crear learning path'}
            </button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Learning paths existentes
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
                  Administra metadatos, estado activo y contenido ordenado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                Recargar
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-white/60">
                Cargando learning paths...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : learningPaths.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-white/60">
                Todavía no hay learning paths creados.
              </div>
            ) : (
              <div className="space-y-4">
                {learningPaths.map((learningPath) => (
                  <article
                    key={learningPath.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {learningPath.title}
                          </h3>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              learningPath.is_active
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/60'
                            }`}
                          >
                            {learningPath.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 dark:text-white/60">
                          {learningPath.description || 'Sin descripción'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-white/50">
                          <span>{learningPath.item_count} talleres</span>
                          <span>Slug: {learningPath.slug || 'auto'}</span>
                          <span>Actualizado: {new Date(learningPath.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/learning-paths/${learningPath.id}`}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                        >
                          Gestionar contenido
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(learningPath.id, learningPath.is_active)}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                        >
                          {learningPath.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(learningPath.id)}
                          className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          Eliminar
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
    </PageShell>
  )
}
