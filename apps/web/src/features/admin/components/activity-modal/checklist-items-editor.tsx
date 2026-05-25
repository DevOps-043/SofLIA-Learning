import { Trash2 } from 'lucide-react'

import { iconButtonClassName, inputClassName } from './styles'
import type { ActivityEditorState } from './use-activity-editor-state'

export function ChecklistItemsEditor({ state }: { state: ActivityEditorState }) {
  return (
    <>
      {state.checklistItems.map((item, index) => (
        <div
          key={item.id || `check-${index}`}
          className="grid gap-3 rounded-xl border border-gray-200 p-3 dark:border-white/10 md:grid-cols-2"
        >
          <input
            type="text"
            value={item.label}
            onChange={(event) => updateChecklistItem(state, index, 'label', event.target.value)}
            className={inputClassName}
            placeholder="Label"
          />
          <input
            type="text"
            value={item.id}
            onChange={(event) => updateChecklistItem(state, index, 'id', event.target.value)}
            className={inputClassName}
            placeholder="check_id"
          />
          <input
            type="text"
            value={item.description || ''}
            onChange={(event) => updateChecklistItem(state, index, 'description', event.target.value)}
            className={`${inputClassName} md:col-span-2`}
            placeholder="Descripcion opcional"
          />
          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-primary dark:text-white">
              <input type="checkbox" checked={item.required} onChange={(event) => updateChecklistItem(state, index, 'required', event.target.checked)} />
              Requerido
            </label>
            <button
              type="button"
              onClick={() => state.setChecklistItems((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))}
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

function updateChecklistItem(
  state: ActivityEditorState,
  index: number,
  key: keyof ActivityEditorState['checklistItems'][number],
  value: string | boolean,
) {
  state.setChecklistItems((current) =>
    current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [key]: value } : item,
    ),
  )
}
