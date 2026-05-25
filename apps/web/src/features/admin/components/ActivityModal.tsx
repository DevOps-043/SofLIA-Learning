'use client'

import { ActivityModalBody } from './activity-modal/activity-modal-body'
import { ActivityModalShell } from './activity-modal/activity-modal-shell'
import type { ActivityModalProps } from './activity-modal/types'
import { useActivityEditorState } from './activity-modal/use-activity-editor-state'
import { useActivityLoader } from './activity-modal/use-activity-loader'
import { useActivitySubmit } from './activity-modal/use-activity-submit'
import { useVisibleTabs } from './activity-modal/use-visible-tabs'

export function ActivityModal({
  activity,
  lessonId: _lessonId,
  onClose,
  onSave,
}: ActivityModalProps) {
  const state = useActivityEditorState()
  useActivityLoader(activity, state)

  const { supportsInteractiveConfig, visibleTabs } = useVisibleTabs(
    state.form.activity_type,
    state.activeTab,
    state.setActiveTab,
  )
  const handleSubmit = useActivitySubmit({ onClose, onSave, state })

  return (
    <ActivityModalShell
      activeTab={state.activeTab}
      activity={activity}
      error={state.error}
      loading={state.loading}
      onClose={onClose}
      onSubmit={handleSubmit}
      setActiveTab={state.setActiveTab}
      visibleTabs={visibleTabs}
    >
      <ActivityModalBody
        activeTab={state.activeTab}
        state={state}
        supportsInteractiveConfig={supportsInteractiveConfig}
      />
    </ActivityModalShell>
  )
}
