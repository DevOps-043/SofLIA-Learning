'use client'

import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { ImportUsersModalState } from './import-users.types'
import { ImportUsersDropZone } from './ImportUsersDropZone'
import { ImportUsersErrorAlert } from './ImportUsersErrorAlert'
import { ImportUsersFormatInfo } from './ImportUsersFormatInfo'
import { ImportUsersResult } from './ImportUsersResult'

export function ImportUsersContent({ state }: { state: ImportUsersModalState }) {
  const theme = useBusinessPanelTheme()

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}>
      <ImportUsersErrorAlert error={state.error} onDismiss={() => state.setError(null)} />
      {state.importResult ? (
        <ImportUsersResult importResult={state.importResult} />
      ) : (
        <div className="space-y-4">
          <ImportUsersDropZone state={state} />
          <ImportUsersFormatInfo />
        </div>
      )}
    </div>
  )
}
