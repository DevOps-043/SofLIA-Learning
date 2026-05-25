import { Trash2 } from 'lucide-react'

import { iconButtonClassName, inputClassName } from './styles'
import type { ActivityEditorState } from './use-activity-editor-state'

export function InlineFieldsEditor({ state }: { state: ActivityEditorState }) {
  return (
    <>
      {state.fields.map((field, index) => (
        <div
          key={field.id || `field-${index}`}
          className="grid gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10 md:grid-cols-2"
        >
          <input
            type="text"
            value={field.label}
            onChange={(event) => updateField(state, index, 'label', event.target.value)}
            className={inputClassName}
            placeholder="Etiqueta"
          />
          <input
            type="text"
            value={field.id}
            onChange={(event) => updateField(state, index, 'id', event.target.value)}
            className={inputClassName}
            placeholder="field_id"
          />
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(event) => updateField(state, index, 'placeholder', event.target.value)}
            className={inputClassName}
            placeholder="Placeholder"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-primary dark:text-white">
              <input type="checkbox" checked={field.required} onChange={(event) => updateField(state, index, 'required', event.target.checked)} />
              Requerido
            </label>
            <label className="flex items-center gap-2 text-sm text-primary dark:text-white">
              <input type="checkbox" checked={field.multiline} onChange={(event) => updateField(state, index, 'multiline', event.target.checked)} />
              Multilinea
            </label>
            <button
              type="button"
              onClick={() => state.setFields((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))}
              className={iconButtonClassName}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </>
  )
}

function updateField(
  state: ActivityEditorState,
  index: number,
  key: keyof ActivityEditorState['fields'][number],
  value: string | boolean,
) {
  state.setFields((current) =>
    current.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, [key]: value } : field,
    ),
  )
}
