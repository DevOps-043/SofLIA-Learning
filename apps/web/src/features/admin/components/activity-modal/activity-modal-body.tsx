import { BasicTab } from './basic-tab'
import { ContentTab } from './content-tab'
import { InteractionTab } from './interaction-tab'
import type { TabKey } from './types'
import type { ActivityEditorState } from './use-activity-editor-state'
import { ValidationTab } from './validation-tab'

interface ActivityModalBodyProps {
  activeTab: TabKey
  state: ActivityEditorState
  supportsInteractiveConfig: boolean
}

export function ActivityModalBody({
  activeTab,
  state,
  supportsInteractiveConfig,
}: ActivityModalBodyProps) {
  if (activeTab === 'basic') {
    return (
      <BasicTab
        state={state}
        supportsInteractiveConfig={supportsInteractiveConfig}
      />
    )
  }
  if (activeTab === 'content') return <ContentTab state={state} />
  if (activeTab === 'interaction') {
    return (
      <InteractionTab
        state={state}
        supportsInteractiveConfig={supportsInteractiveConfig}
      />
    )
  }
  return (
    <ValidationTab
      state={state}
      supportsInteractiveConfig={supportsInteractiveConfig}
    />
  )
}
