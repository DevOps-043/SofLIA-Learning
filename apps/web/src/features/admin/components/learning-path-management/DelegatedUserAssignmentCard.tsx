import type { LpTranslator } from './types'

export function DelegatedUserAssignmentCard({ lp }: { lp: LpTranslator }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {lp('assignUserDelegatedTitle', 'Asignacion a usuarios desde empresa')}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
        {lp('assignUserDelegatedDescription', 'Una vez creada la ruta y entregada a una empresa, esa organizacion decide desde su propio panel a que usuarios asignarla.')}
      </p>
      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70">
        {lp('assignUserDelegatedHint', 'El panel admin mantiene la creacion, edicion y asignacion por empresa. La asignacion individual queda delegada al panel de cada organizacion.')}
      </div>
    </div>
  )
}
