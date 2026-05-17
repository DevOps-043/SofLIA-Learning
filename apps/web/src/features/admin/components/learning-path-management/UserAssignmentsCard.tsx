import type { LearningPathUserAssignmentSummary, LpTranslator } from './types'
import { getUserLabel } from './types'

interface UserAssignmentsCardProps {
  assignments: LearningPathUserAssignmentSummary[]
  lp: LpTranslator
}

export function UserAssignmentsCard({ assignments, lp }: UserAssignmentsCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lp('userAssignmentsTitle', 'Usuarios con asignacion individual')}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          {lp('userAssignmentsReadonlyDescription', 'Consulta las asignaciones hechas por cada empresa desde su panel. Este listado es solo informativo.')}
        </p>
      </div>
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-white/10 dark:text-white/60">
          {lp('noUserAssignments', 'Esta ruta todavia no tiene asignaciones individuales.')}
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(assignment => (
            <div key={assignment.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-gray-200 p-4 dark:border-white/10 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="break-words font-semibold text-gray-900 dark:text-white">
                  {getUserLabel(assignment.user) || lp('unnamedUser', 'Usuario sin nombre')}
                </p>
                <p className="break-words text-sm text-gray-500 dark:text-white/60">{assignment.organization_name}</p>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {lp('assignedAt', 'Asignado: {{date}}', { date: new Date(assignment.assigned_at).toLocaleDateString() })}
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
  )
}
