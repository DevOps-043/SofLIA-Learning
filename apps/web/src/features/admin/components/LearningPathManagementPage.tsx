'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'

import { PageShell } from '@/core/layout'
import { useLearningPathManagement } from '../hooks'
import { ConfirmationModal } from './ConfirmationModal'

interface LearningPathManagementPageProps {
  learningPathId: string
}

function getUserLabel(user: {
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
} | null | undefined) {
  if (!user) {
    return null
  }

  const composedName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()

  return user.display_name || composedName || user.email
}

export function LearningPathManagementPage({
  learningPathId,
}: LearningPathManagementPageProps) {
  const { t } = useTranslation('admin')
  const lp = (key: string, defaultValue: string, options?: Record<string, unknown>) =>
    t(`learningPathsPage.${key}`, { defaultValue, ...(options || {}) })
  const {
    learningPath,
    availableCourses,
    availableOrganizations,
    activeOrganizationAssignments,
    activeUserAssignments,
    selectedCourseId,
    selectedOrganizationId,
    loading,
    saving,
    error,
    removeTargetId,
    organizationAssignmentToRevoke,
    setLearningPath,
    setSelectedCourseId,
    setSelectedOrganizationId,
    setRemoveTargetId,
    setOrganizationAssignmentToRevoke,
    handleMetadataSave,
    handleAddCourse,
    handleReorder,
    handleConfirmedRemoveItem,
    handleAssignToOrganization,
    handleConfirmRevokeOrganizationAssignment,
  } = useLearningPathManagement({ learningPathId })

  if (loading) {
    return (
      <PageShell spacing="relaxed">
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
          {lp('loading', 'Cargando rutas de aprendizaje...')}
        </div>
      </PageShell>
    )
  }

  if (!learningPath) {
    return (
      <PageShell spacing="relaxed">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error || lp('notFound', 'Ruta de aprendizaje no encontrada')}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell spacing="relaxed">
      <section className="space-y-8">
        <header className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-3">
              <Link
                href="/admin/learning-paths"
                className="inline-flex text-sm font-medium text-[var(--color-accent)]"
              >
                {lp('backToList', 'Volver a rutas de aprendizaje')}
              </Link>
              <div className="space-y-2">
                <h1 className="break-words text-3xl font-bold sm:text-4xl">{learningPath.title}</h1>
                <p className="max-w-3xl break-words text-sm text-white/70">
                  {learningPath.description || lp('noDescriptionYet', 'Sin descripción todavía.')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-white/60">
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
                  {learningPath.is_active
                    ? lp('active', 'Activo')
                    : lp('inactive', 'Inactivo')}
                </span>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:max-w-[30rem]">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="break-words text-[11px] uppercase tracking-[0.16em] text-white/50">
                  {lp('statsWorkshops', 'Talleres')}
                </p>
                <p className="mt-2 text-2xl font-bold">{learningPath.item_count}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="break-words text-[11px] uppercase tracking-[0.16em] text-white/50">
                  {lp('statsOrganizations', 'Empresas')}
                </p>
                <p className="mt-2 text-2xl font-bold">{activeOrganizationAssignments.length}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="break-words text-[11px] uppercase tracking-[0.16em] text-white/50">
                  {lp('statsUsers', 'Usuarios')}
                </p>
                <p className="mt-2 text-2xl font-bold">{activeUserAssignments.length}</p>
              </div>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lp('metadata', 'Metadatos')}
              </h2>
              <div className="mt-4 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                    {lp('titleLabel', 'Título')}
                  </span>
                  <input
                    value={learningPath.title}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current ? { ...current, title: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                    {lp('slugLabel', 'Slug')}
                  </span>
                  <input
                    value={learningPath.slug || ''}
                    onChange={(event) =>
                      setLearningPath((current) =>
                        current ? { ...current, slug: event.target.value } : current,
                      )
                    }
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-white/80">
                    {lp('descriptionLabel', 'Descripción')}
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
                    className="min-h-32 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                  />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
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
                    className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-primary)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                  >
                    {saving
                      ? lp('saving', 'Guardando...')
                      : lp('saveMetadata', 'Guardar metadatos')}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void handleMetadataSave({ is_active: !learningPath.is_active })
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5 sm:w-auto"
                  >
                    {learningPath.is_active
                      ? lp('deactivate', 'Desactivar')
                      : lp('activate', 'Activar')}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lp('addWorkshop', 'Agregar taller')}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                {lp(
                  'addWorkshopDescription',
                  'El mismo taller puede vivir en varias rutas, pero una sola vez dentro de esta.',
                )}
              </p>

              <div className="mt-4 space-y-3">
                <select
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">{lp('selectWorkshop', 'Selecciona un taller')}</option>
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
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
                >
                  {saving
                    ? lp('adding', 'Agregando...')
                    : lp('addToPath', 'Agregar a la ruta')}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lp('assignOrganizationTitle', 'Asignar a empresa')}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                {lp(
                  'assignOrganizationDescription',
                  'Entrega esta ruta completa a una organización con el orden secuencial ya definido.',
                )}
              </p>

              <div className="mt-4 space-y-3">
                <select
                  value={selectedOrganizationId}
                  onChange={(event) => setSelectedOrganizationId(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
                >
                  <option value="">
                    {lp('selectOrganization', 'Selecciona una empresa')}
                  </option>
                  {availableOrganizations.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!selectedOrganizationId || saving}
                  onClick={() => void handleAssignToOrganization()}
                  className="w-full rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? lp('assigning', 'Asignando...')
                    : lp('assignOrganizationButton', 'Asignar a empresa')}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lp('assignUserDelegatedTitle', 'Asignacion a usuarios desde empresa')}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                {lp(
                  'assignUserDelegatedDescription',
                  'Una vez creada la ruta y entregada a una empresa, esa organizacion decide desde su propio panel a que usuarios asignarla.',
                )}
              </p>

              <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70">
                {lp(
                  'assignUserDelegatedHint',
                  'El panel admin mantiene la creacion, edicion y asignacion por empresa. La asignacion individual queda delegada al panel de cada organizacion.',
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {lp('sequenceTitle', 'Secuencia de la ruta')}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {lp(
                    'sequenceDescription',
                    'El siguiente taller se desbloqueará solo cuando el anterior esté completado.',
                  )}
                </p>
              </div>

              {learningPath.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
                  {lp(
                    'emptySequence',
                    'Esta ruta está vacía. Agrega el primer taller para iniciar la secuencia.',
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {learningPath.items
                    .slice()
                    .sort((left, right) => left.position - right.position)
                    .map((item, index) => (
                      <div
                        key={item.id}
                        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03] xl:flex-row xl:items-start xl:justify-between"
                      >
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-[var(--color-accent)]">
                            <div className="absolute inset-0 rounded-2xl bg-[var(--color-accent)] opacity-10" />
                            <span className="relative">{item.position}</span>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="break-words text-base font-semibold leading-snug text-gray-900 dark:text-white">
                              {item.course?.title || lp('untitledCourse', 'Curso sin título')}
                            </p>
                            <p className="break-words text-sm text-gray-500 dark:text-white/60">
                              {(item.course?.category || lp('noCategory', 'Sin categoría'))}
                              {' / '}
                              {(item.course?.level || lp('noLevel', 'Sin nivel'))}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:shrink-0 xl:justify-end">
                          <button
                            type="button"
                            disabled={index === 0 || saving}
                            onClick={() => void handleReorder(index, index - 1)}
                            className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                          >
                            {lp('moveUp', 'Subir')}
                          </button>
                          <button
                            type="button"
                            disabled={index === learningPath.items.length - 1 || saving}
                            onClick={() => void handleReorder(index, index + 1)}
                            className="rounded-2xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-40 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10"
                          >
                            {lp('moveDown', 'Bajar')}
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setRemoveTargetId(item.id)}
                            className="rounded-2xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10"
                          >
                            {lp('removeWorkshop', 'Eliminar')}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {lp('organizationAssignmentsTitle', 'Empresas con esta ruta')}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {lp(
                    'organizationAssignmentsDescription',
                    'Controla qué organizaciones tienen activa esta ruta de aprendizaje.',
                  )}
                </p>
              </div>

              {activeOrganizationAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
                  {lp(
                    'noOrganizationAssignments',
                    'Esta ruta todavía no está asignada a ninguna empresa.',
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrganizationAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="break-words font-semibold text-gray-900 dark:text-white">
                          {assignment.organization_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-white/60">
                          {lp('assignedAt', 'Asignado: {{date}}', {
                            date: new Date(assignment.assigned_at).toLocaleDateString(),
                          })}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setOrganizationAssignmentToRevoke(assignment)}
                        className="w-full rounded-2xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 sm:w-auto xl:shrink-0"
                      >
                        {lp('revokeOrganizationAssignment', 'Revocar asignación')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {lp('userAssignmentsTitle', 'Usuarios con asignación individual')}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                  {lp(
                    'userAssignmentsReadonlyDescription',
                    'Consulta las asignaciones hechas por cada empresa desde su panel. Este listado es solo informativo.',
                  )}
                </p>
              </div>

              {activeUserAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
                  {lp(
                    'noUserAssignments',
                    'Esta ruta todavía no tiene asignaciones individuales.',
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {activeUserAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="break-words font-semibold text-gray-900 dark:text-white">
                          {getUserLabel(assignment.user) || lp('unnamedUser', 'Usuario sin nombre')}
                        </p>
                        <p className="break-words text-sm text-gray-500 dark:text-white/60">
                          {assignment.organization_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-white/60">
                          {lp('assignedAt', 'Asignado: {{date}}', {
                            date: new Date(assignment.assigned_at).toLocaleDateString(),
                          })}
                        </p>
                      </div>

                      <span className="w-full rounded-full bg-gray-100 px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-white/60 sm:w-auto xl:shrink-0">
                        {lp('managedByCompany', 'Gestionado por empresa')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </section>

      <ConfirmationModal
        isOpen={Boolean(removeTargetId)}
        onClose={() => setRemoveTargetId(null)}
        onConfirm={() => void handleConfirmedRemoveItem()}
        title={lp('removeTitle', 'Quitar taller de la ruta')}
        message={lp(
          'removeMessage',
          'El taller se quitará de la secuencia, pero no se revocará el acceso que ya haya sido otorgado por otras asignaciones.',
        )}
        confirmText={lp('removeConfirm', 'Quitar taller')}
        type="danger"
        isLoading={saving}
      />

      <ConfirmationModal
        isOpen={Boolean(organizationAssignmentToRevoke)}
        onClose={() => setOrganizationAssignmentToRevoke(null)}
        onConfirm={() => void handleConfirmRevokeOrganizationAssignment()}
        title={lp('revokeOrganizationTitle', 'Revocar asignación organizacional')}
        message={lp(
          'revokeOrganizationMessage',
          'La empresa "{{organization}}" dejará de tener esta ruta activa para nuevas consultas. Los accesos directos ya otorgados por otras vías no se eliminan automáticamente.',
          {
          organization: organizationAssignmentToRevoke?.organization_name || '',
          },
        )}
        confirmText={lp('revokeOrganizationAssignment', 'Revocar asignación')}
        type="danger"
        isLoading={saving}
      />

    </PageShell>
  )
}
