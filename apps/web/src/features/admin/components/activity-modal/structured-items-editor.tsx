import { Plus } from 'lucide-react'

import { defaultChecklistItem, defaultField } from './defaults'
import { ChecklistItemsEditor } from './checklist-items-editor'
import { InlineFieldsEditor } from './inline-fields-editor'
import { panelClassName, smallButtonClassName } from './styles'
import type { ActivityEditorState } from './use-activity-editor-state'

export function StructuredItemsEditor({ state }: { state: ActivityEditorState }) {
  const isInlineAnswers = state.interactionType === 'inline_answers'
  const isChecklist = state.interactionType === 'checklist'
  if (!isInlineAnswers && !isChecklist) return null

  return (
    <div className={`space-y-3 ${panelClassName}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary dark:text-white">
          {isInlineAnswers ? 'Campos inline' : 'Items del checklist'}
        </p>
        <button type="button" onClick={() => addItem(state)} className={smallButtonClassName}>
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>
      {isInlineAnswers ? <InlineFieldsEditor state={state} /> : null}
      {isChecklist ? <ChecklistItemsEditor state={state} /> : null}
    </div>
  )
}

function addItem(state: ActivityEditorState) {
  if (state.interactionType === 'inline_answers') {
    state.setFields((current) => [...current, defaultField(current.length + 1)])
    return
  }
  state.setChecklistItems((current) => [
    ...current,
    defaultChecklistItem(current.length + 1),
  ])
}
