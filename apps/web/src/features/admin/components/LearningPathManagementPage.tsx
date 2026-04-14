'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { PageShell } from '@/core/layout'
import type { LearningPath } from '../types'

interface CourseOption {
  id: string
  title: string
}

interface LearningPathManagementPageProps {
  learningPathId: string
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export function LearningPathManagementPage({
  learningPathId,
}: LearningPathManagementPageProps) {
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [allCourses, setAllCourses] = useState<CourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const [pathResponse, coursesResponse] = await Promise.all([
        fetch(`/api/admin/learning-paths/${learningPathId}`),
        fetch('/api/admin/courses'),
      ])

      const [pathData, coursesData] = await Promise.all([
        pathResponse.json(),
        coursesResponse.json(),
      ])

      if (!pathResponse.ok || !pathData.success) {
        throw new Error(pathData.error || 'No se pudo cargar el learning path')
      }

      if (!coursesResponse.ok || !coursesData.success) {
        throw new Error(coursesData.error || 'No se pudo cargar el catálogo de cursos')
      }

      setLearningPath(pathData.learningPath)
      setAllCourses(coursesData.courses || [])
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No se pudo cargar el learning path',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [learningPathId])

  const availableCourses = useMemo(() => {
    const usedCourseIds = new Set(learningPath?.items.map((item) => item.course_id) || [])
    return allCourses.filter((course) => !usedCourseIds.has(course.id))
  }, [allCourses, learningPath?.items])

  async function handleMetadataSave(updates: Partial<LearningPath>) {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo actualizar el learning path')
      }

      setLearningPath(data.learningPath)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo actualizar el learning path',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCourse() {
    if (!selectedCourseId) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/learning-paths/${learningPathId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo agregar el curso')
      }

      setSelectedCourseId('')
      await loadData()
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : 'No se pudo agregar el curso',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveItem(itemId: string) {
    const confirmed = window.confirm('¿Eliminar este taller del learning path?')
    if (!confirmed) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/learning-paths/${learningPathId}/items/${itemId}`,
        { method: 'DELETE' },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo eliminar el taller')
      }

      await loadData()
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'No se pudo eliminar el taller',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (!learningPath || toIndex < 0 || toIndex >= learningPath.items.length) return

    const reordered = moveItem(learningPath.items, fromIndex, toIndex)
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/learning-paths/${learningPathId}/items/reorder`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderedItemIds: reordered.map((item) => item.id),
          }),
        },
      )
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo reordenar el learning path')
      }

      setLearningPath(data.learningPath)
    } catch (reorderError) {
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : 'No se pudo reordenar el learning path',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageShell spacing="relaxed">
        <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-sm text-slate-500 dark:border-white/10 dark:text-white/60">
          Cargando learning path...
        </div>
      </PageShell>
    )
  }

  if (!learningPath) {
    return (
      <PageShell spacing="relaxed">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error || 'Learning path no encontrado'}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell spacing="relaxed">
      <section className="space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-white/10 bg-[#0F1419] p-8 text-white">
          <div className="space-y-2">
            <Link href="/admin/learning-paths" className="text-sm text-[#00D4B3]">
              ← Volver a learning paths
            </Link>
            <h1 className="text-3xl font-bold">{learningPath.title}</h1>
            <p className="max-w-3xl text-sm text-white/70">
              {learningPath.description || 'Sin descripción todavía.'}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-white/50">
              <span>{learningPath.item_count} talleres</span>
              <span>Slug: {learningPath.slug || 'auto'}</span>
              <span>{learningPath.is_active ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleMetadataSave({ is_active: !learningPath.is_active })
            }
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
          >
            {learningPath.is_active ? 'Desactivar' : 'Activar'}
          </button>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[380px,1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Metadatos
              </h2>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                    Título
                  </span>
                  <input
                    value={learningPath.title}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current
                          ? { ...current, title: event.target.value }
                          : current,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00D4B3] dark:border-white/10 dark:bg-[#0F172A] dark:text-white"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                    Slug
                  </span>
                  <input
                    value={learningPath.slug || ''}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current
                          ? { ...current, slug: event.target.value }
                          : current,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00D4B3] dark:border-white/10 dark:bg-[#0F172A] dark:text-white"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-white/80">
                    Descripción
                  </span>
                  <textarea
                    value={learningPath.description || ''}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current
                          ? { ...current, description: event.target.value }
                          : current,
                      )
                    }
                    className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00D4B3] dark:border-white/10 dark:bg-[#0F172A] dark:text-white"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    void handleMetadataSave({
                      title: learningPath.title,
                      slug: learningPath.slug,
                      description: learningPath.description,
                      is_active: learningPath.is_active,
                    })
                  }
                  className="w-full rounded-2xl bg-[#00D4B3] px-4 py-3 text-sm font-semibold text-[#0A2540] transition hover:bg-[#18e3c4] disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar metadatos'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Agregar taller
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
                El mismo taller puede vivir en varios learning paths, pero una sola vez dentro de este.
              </p>
              <div className="mt-4 space-y-3">
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#00D4B3] dark:border-white/10 dark:bg-[#0F172A] dark:text-white"
                >
                  <option value="">Selecciona un taller</option>
                  {availableCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedCourseId || saving}
                  onClick={() => void handleAddCourse()}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                >
                  {saving ? 'Agregando...' : 'Agregar al learning path'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111827]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Secuencia del learning path
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-white/60">
                El siguiente taller se desbloqueará solo cuando el anterior esté completado.
              </p>
            </div>

            {learningPath.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-white/60">
                Este learning path está vacío. Agrega el primer taller para iniciar la secuencia.
              </div>
            ) : (
              <div className="space-y-4">
                {learningPath.items
                  .slice()
                  .sort((left, right) => left.position - right.position)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03] lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00D4B3]/10 text-sm font-bold text-[#00D4B3]">
                          {item.position}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                            {item.course?.title || 'Curso sin título'}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-white/60">
                            {item.course?.category || 'Sin categoría'} · {item.course?.level || 'Sin nivel'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={index === 0 || saving}
                          onClick={() => void handleReorder(index, index - 1)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          disabled={index === learningPath.items.length - 1 || saving}
                          onClick={() => void handleReorder(index, index + 1)}
                          className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                        >
                          Bajar
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleRemoveItem(item.id)}
                          className="rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </PageShell>
  )
}
