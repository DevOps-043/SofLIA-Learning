import type { ActivityEditorState } from './use-activity-editor-state'
import type { ActivityType } from './types'
import { ActivityTypeNotice, EstimatedTimeHint } from './basic-tab-hints'
import { inputClassName, labelTextClassName, panelClassName } from './styles'

const activityTypes: Array<{ label: string; value: ActivityType }> = [
  { value: 'reflection', label: 'Reflexion' },
  { value: 'exercise', label: 'Ejercicio' },
  { value: 'reading', label: 'Lectura' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'discussion', label: 'Discusion' },
  { value: 'ai_chat', label: 'Chat con IA' },
]

export function BasicTab({
  state,
  supportsInteractiveConfig,
}: {
  state: ActivityEditorState
  supportsInteractiveConfig: boolean
}) {
  const { form, setForm } = state

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2 md:col-span-2">
        <span className={labelTextClassName}>Titulo</span>
        <input
          type="text"
          value={form.activity_title}
          onChange={(event) => setForm((current) => ({ ...current, activity_title: event.target.value }))}
          className={inputClassName}
          placeholder="Ej: Analiza y valida esta noticia"
        />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className={labelTextClassName}>Descripcion</span>
        <textarea
          rows={3}
          value={form.activity_description}
          onChange={(event) => setForm((current) => ({ ...current, activity_description: event.target.value }))}
          className={inputClassName}
          placeholder="Contexto opcional para el autor y para SofLIA."
        />
      </label>
      <label className="space-y-2">
        <span className={labelTextClassName}>Tipo de actividad</span>
        <select
          value={form.activity_type}
          onChange={(event) => setForm((current) => ({ ...current, activity_type: event.target.value as ActivityType }))}
          className={inputClassName}
        >
          {activityTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className={labelTextClassName}>Tiempo estimado (min)</span>
        <input
          type="number"
          min={1}
          max={480}
          value={form.estimated_time_minutes}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              estimated_time_minutes: event.target.value.trim() === '' ? '' : Number(event.target.value),
            }))
          }
          className={inputClassName}
        />
        <EstimatedTimeHint form={form} />
      </label>
      <label className={`flex items-start gap-3 text-sm md:col-span-2 ${panelClassName}`}>
        <input
          type="checkbox"
          checked={form.is_required}
          onChange={(event) => setForm((current) => ({ ...current, is_required: event.target.checked }))}
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-primary dark:text-white">
          Marcar como requerida para que el alumno deba completarla antes de avanzar.
        </span>
      </label>
      {!supportsInteractiveConfig ? <ActivityTypeNotice type={form.activity_type} /> : null}
    </div>
  )
}
