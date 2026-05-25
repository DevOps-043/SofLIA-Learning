import { ExternalToolEditor } from './external-tool-editor'
import { InteractionSettings } from './interaction-settings'
import { StructuredItemsEditor } from './structured-items-editor'
import { mutedPanelClassName } from './styles'
import type { ActivityEditorState } from './use-activity-editor-state'

export function InteractionTab({
  state,
  supportsInteractiveConfig,
}: {
  state: ActivityEditorState
  supportsInteractiveConfig: boolean
}) {
  return (
    <div className="space-y-4">
      {!supportsInteractiveConfig ? (
        <div className={mutedPanelClassName}>
          Esta actividad conserva su flujo actual y no usa `activity_config`.
        </div>
      ) : (
        <>
          <InteractionSettings state={state} />
          <StructuredItemsEditor state={state} />
          <ExternalToolEditor state={state} />
        </>
      )}
    </div>
  )
}
