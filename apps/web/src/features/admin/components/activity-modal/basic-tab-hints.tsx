import { mutedPanelClassName } from './styles'
import type { ActivityFormState, ActivityType } from './types'

export function EstimatedTimeHint({ form }: { form: ActivityFormState }) {
  if (form.estimated_time_minutes === '') {
    return (
      <p className="text-xs text-amber-600 dark:text-amber-400">
        Esta actividad aun no tiene un tiempo guardado en la base de datos.
      </p>
    )
  }
  if (form.activity_type === 'reading') {
    return (
      <p className="text-xs text-gray-600 dark:text-white/60">
        Para lecturas, el tiempo se calcula automaticamente en la pestana de contenido.
      </p>
    )
  }
  return null
}

export function ActivityTypeNotice({ type }: { type: ActivityType }) {
  const message =
    type === 'reading'
      ? 'Las lecturas usan un flujo simple: contenido renderizado y tiempo estimado automatico.'
      : type === 'quiz'
        ? 'Los quizzes mantienen su flujo actual y se configuran desde el contenido del quiz.'
        : 'Las actividades ai_chat mantienen su flujo actual y usan prompts estructurados.'

  return <div className={`md:col-span-2 ${mutedPanelClassName}`}>{message}</div>
}
