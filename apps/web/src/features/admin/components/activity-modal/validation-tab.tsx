import { inputClassName, labelTextClassName, mutedPanelClassName, panelClassName } from './styles'
import type { ActivityEditorState } from './use-activity-editor-state'

export function ValidationTab({
  state,
  supportsInteractiveConfig,
}: {
  state: ActivityEditorState
  supportsInteractiveConfig: boolean
}) {
  if (!supportsInteractiveConfig) {
    return (
      <div className="space-y-4">
        <div className={mutedPanelClassName}>
          La validacion estructurada con SofLIA aplica en esta fase solo para actividades interactivas basadas en `activity_config`.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className={`flex items-start gap-3 text-sm ${panelClassName}`}>
        <input
          type="checkbox"
          checked={state.validationEnabled}
          onChange={(event) => {
            state.setValidationEnabled(event.target.checked)
            if (!event.target.checked) state.setRequiredForCompletion(false)
          }}
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-primary dark:text-white">
          Habilitar validacion con SofLIA para esta actividad.
        </span>
      </label>
      <label className={`flex items-start gap-3 text-sm ${panelClassName}`}>
        <input
          type="checkbox"
          checked={state.requiredForCompletion}
          disabled={!state.validationEnabled}
          onChange={(event) => state.setRequiredForCompletion(event.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span className={state.validationEnabled ? 'text-primary dark:text-white' : 'text-gray-400 dark:text-white/40'}>
          Exigir resultado `pass` para completar la leccion.
        </span>
      </label>
      <label className="space-y-2">
        <span className={labelTextClassName}>Rubrica</span>
        <textarea
          rows={8}
          value={state.rubricText}
          onChange={(event) => state.setRubricText(event.target.value)}
          className={inputClassName}
          placeholder={'Un criterio por linea.\nEj: Verifica si eligio la herramienta correcta.\nEj: Explica con una razon breve y precisa.'}
        />
      </label>
      <div className={mutedPanelClassName}>
        SofLIA devolvera `pass`, `revise` o `error`, junto con resumen, fortalezas, mejoras y siguiente paso sugerido.
      </div>
    </div>
  )
}
