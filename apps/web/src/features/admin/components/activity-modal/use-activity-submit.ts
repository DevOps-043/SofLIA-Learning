import type { FormEvent } from 'react'

import type { CreateActivityData } from '../../services/adminActivities.service'
import { buildActivityPayload } from './activity-payload'
import type { ActivityEditorState } from './use-activity-editor-state'

interface UseActivitySubmitInput {
  onClose: () => void
  onSave: (data: CreateActivityData) => Promise<void>
  state: ActivityEditorState
}

export function useActivitySubmit({ onClose, onSave, state }: UseActivitySubmitInput) {
  return async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    state.setError(null)

    try {
      const payload = buildActivityPayload(state)
      state.setLoading(true)
      await onSave(payload)
      onClose()
    } catch (submitError) {
      state.setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la actividad.',
      )
    } finally {
      state.setLoading(false)
    }
  }
}
