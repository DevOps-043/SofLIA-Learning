'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { ImportResult } from './import-users.types'

export function ImportUsersResult({ importResult }: { importResult: ImportResult }) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const isSuccess = importResult.imported > 0

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl flex items-center gap-4" style={{ backgroundColor: isSuccess ? `color-mix(in srgb, ${theme.successColor} 7.1%, transparent)` : `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`, border: `1px solid ${isSuccess ? `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)` : `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)`}` }}>
        {isSuccess ? <CheckCircle className="w-8 h-8" style={{ color: theme.successColor }} /> : <XCircle className="w-8 h-8" style={{ color: theme.dangerColor }} />}
        <div>
          <p className="font-semibold" style={{ color: theme.textColor }}>{isSuccess ? t('users.modals.import.results.successTitle') : t('users.modals.import.results.noImportTitle')}</p>
          <p className="text-sm mt-0.5" style={{ color: theme.subtextColor }}>{importResult.imported} de {importResult.total} usuarios fueron importados correctamente</p>
        </div>
      </div>
      {importResult.errors > 0 && importResult.details.length > 0 && <ImportErrorDetails importResult={importResult} />}
    </div>
  )
}

function ImportErrorDetails({ importResult }: { importResult: ImportResult }) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div>
      <p className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: theme.textColor }}>
        <XCircle className="w-4 h-4" style={{ color: theme.dangerColor }} />
        {t('users.modals.import.results.errorsFound')} ({importResult.errors})
      </p>
      <div className="max-h-40 lg:max-h-48 overflow-y-auto space-y-2 p-3 rounded-xl border" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 3.1%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 9.4%, transparent)`, scrollbarWidth: 'thin', scrollbarColor: `${theme.borderColor} transparent` }}>
        {importResult.details.slice(0, 10).map((detail, index) => <div key={index} className="text-sm p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`, color: theme.dangerColor }}><span className="font-medium">Fila {detail.row}:</span> {detail.error}</div>)}
        {importResult.details.length > 10 && <p className="text-xs text-center py-2" style={{ color: `color-mix(in srgb, ${theme.dangerColor} 70.2%, transparent)` }}>Y {importResult.details.length - 10} errores mas...</p>}
      </div>
    </div>
  )
}
