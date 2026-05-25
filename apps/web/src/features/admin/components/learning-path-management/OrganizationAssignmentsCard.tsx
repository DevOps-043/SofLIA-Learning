import type { LearningPathOrganizationAssignmentSummary, LpTranslator, SetOrganizationAssignmentToRevoke } from './types'

interface OrganizationAssignmentsCardProps {
  assignments: LearningPathOrganizationAssignmentSummary[]
  lp: LpTranslator
  saving: boolean
  setOrganizationAssignmentToRevoke: SetOrganizationAssignmentToRevoke
}

export function OrganizationAssignmentsCard({
  assignments,
  lp,
  saving,
  setOrganizationAssignmentToRevoke,
}: OrganizationAssignmentsCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lp('organizationAssignmentsTitle', 'Empresas con esta ruta')}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">{lp('organizationAssignmentsDescription', 'Controla que organizaciones tienen activa esta ruta de aprendizaje.')}</p>
      </div>
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
          {lp('noOrganizationAssignments', 'Esta ruta todavia no esta asignada a ninguna empresa.')}
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(assignment => (
            <div key={assignment.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="break-words font-semibold text-gray-900 dark:text-white">{assignment.organization_name}</p>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {lp('assignedAt', 'Asignado: {{date}}', { date: new Date(assignment.assigned_at).toLocaleDateString() })}
                </p>
              </div>
              <button type="button" disabled={saving} onClick={() => setOrganizationAssignmentToRevoke(assignment)} className="w-full rounded-2xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 sm:w-auto xl:shrink-0">
                {lp('revokeOrganizationAssignment', 'Revocar asignacion')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
