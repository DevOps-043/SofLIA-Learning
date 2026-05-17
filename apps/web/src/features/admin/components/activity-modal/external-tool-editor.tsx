import { useMemo } from 'react'

import { externalToolRegistry } from '@/features/courses/config/external-tool-registry'
import { supportedExternalToolKeys, type ExternalToolKey } from '@/features/courses/types/activity-config'

import { inputClassName, panelClassName, textareaClassName } from './styles'
import type { ActivityEditorState } from './use-activity-editor-state'

export function ExternalToolEditor({ state }: { state: ActivityEditorState }) {
  const selectedToolLabel = useMemo(() => {
    if (!state.toolKey) return ''
    return externalToolRegistry[state.toolKey]?.label ?? state.toolKey
  }, [state.toolKey])

  return (
    <div className={`space-y-3 ${panelClassName}`}>
      <div>
        <p className="text-sm font-medium text-primary dark:text-white">Herramienta externa</p>
        <p className="text-xs text-gray-600 dark:text-white/60">Registro central soportado en v1.</p>
      </div>
      <select
        value={state.toolKey}
        onChange={(event) => state.setToolKey(event.target.value as ExternalToolKey | '')}
        className={inputClassName}
      >
        <option value="">Sin herramienta externa</option>
        {supportedExternalToolKeys.map((item) => (
          <option key={item} value={item}>
            {externalToolRegistry[item].label}
          </option>
        ))}
      </select>
      {state.toolKey ? (
        <>
          <textarea
            rows={6}
            value={state.promptTemplate}
            onChange={(event) => state.setPromptTemplate(event.target.value)}
            className={textareaClassName}
            placeholder={`Prompt base para ${selectedToolLabel}`}
          />
          <div className="flex flex-wrap gap-4 text-sm text-primary dark:text-white">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={state.openInNewTab} onChange={(event) => state.setOpenInNewTab(event.target.checked)} />
              Abrir en nueva pestana
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={state.showCopyButton} onChange={(event) => state.setShowCopyButton(event.target.checked)} />
              Mostrar boton copiar
            </label>
          </div>
        </>
      ) : null}
    </div>
  )
}
