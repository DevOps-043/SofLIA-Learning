import type { ActivityInteractionType } from '@/features/courses/types/activity-config'

import { inputClassName, labelTextClassName, panelClassName } from './styles'
import type { ActivityEditorState } from './use-activity-editor-state'

export function InteractionSettings({ state }: { state: ActivityEditorState }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelTextClassName}>Tipo de interaccion</span>
          <select
            value={state.interactionType}
            onChange={(event) => state.setInteractionType(event.target.value as ActivityInteractionType)}
            className={inputClassName}
          >
            <option value="long_text">Long text</option>
            <option value="inline_answers">Inline answers</option>
            <option value="checklist">Checklist</option>
            <option value="external_tool_task">External tool task</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className={labelTextClassName}>Maximo de caracteres</span>
          <input
            type="number"
            min={1}
            value={state.maxLength}
            onChange={(event) => state.setMaxLength(event.target.value ? Number(event.target.value) : '')}
            className={inputClassName}
            placeholder="Opcional"
          />
        </label>
        <label className="space-y-2">
          <span className={labelTextClassName}>Placeholder de respuesta</span>
          <input
            type="text"
            value={state.responsePlaceholder}
            onChange={(event) => state.setResponsePlaceholder(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="space-y-2">
          <span className={labelTextClassName}>Placeholder de evidencia</span>
          <input
            type="text"
            value={state.evidencePlaceholder}
            onChange={(event) => state.setEvidencePlaceholder(event.target.value)}
            className={inputClassName}
          />
        </label>
      </div>
      <label className={`flex items-start gap-3 text-sm ${panelClassName}`}>
        <input
          type="checkbox"
          checked={state.requireEvidence}
          onChange={(event) => state.setRequireEvidence(event.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span className="text-primary dark:text-white">
          Solicitar evidencia adicional del usuario en esta actividad.
        </span>
      </label>
    </>
  )
}
