'use client'

import { motion } from 'framer-motion'
import { Download, FileSpreadsheet, FileText, Sparkles, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { ImportResult } from './import-users.types'

interface ImportUsersPreviewPanelProps {
  importResult: ImportResult | null
  onDownloadTemplate: () => void | Promise<void>
  selectedFile: File | null
}

export function ImportUsersPreviewPanel({ importResult, onDownloadTemplate, selectedFile }: ImportUsersPreviewPanelProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r shrink-0" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${theme.primaryColor} 8.2%, transparent), color-mix(in srgb, ${theme.accentColor} 6.3%, transparent))`, borderColor: theme.borderColor }}>
      <div className="flex-1 flex flex-col items-center justify-center py-2 lg:py-0">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="relative mb-6">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${theme.primaryColor} 18.8%, transparent), color-mix(in srgb, ${theme.accentColor} 18.8%, transparent))`, border: `2px solid color-mix(in srgb, ${theme.primaryColor} 31.4%, transparent)` }}>
            <Upload className="w-12 h-12" style={{ color: theme.onPrimaryColor }} />
          </div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.accentColor }}>
            <Sparkles className="w-4 h-4" style={{ color: theme.onPrimaryColor }} />
          </motion.div>
        </motion.div>
        <h2 className="text-xl font-bold mb-2 text-center" style={{ color: theme.textColor }}>{t('users.modals.import.title')}</h2>
        <p className="text-sm text-center mb-8" style={{ color: theme.subtextColor }}>{t('users.modals.import.subtitle')}</p>
        <PreviewState importResult={importResult} selectedFile={selectedFile} />
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => void onDownloadTemplate()} className="w-full py-3 px-4 rounded-xl border transition-colors flex items-center justify-center gap-2 text-sm font-medium" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg, color: theme.textColor }}>
        <Download className="w-4 h-4" style={{ color: theme.textColor }} />
        {t('users.modals.import.downloadTemplate')}
      </motion.button>
    </div>
  )
}

function PreviewState({ importResult, selectedFile }: Pick<ImportUsersPreviewPanelProps, 'importResult' | 'selectedFile'>) {
  const theme = useBusinessPanelTheme()
  if (importResult) return <ImportStatsPreview importResult={importResult} />
  if (selectedFile) {
    return (
      <div className="w-full p-4 rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent)` }}>
            <FileSpreadsheet className="w-5 h-5" style={{ color: theme.primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: theme.textColor }}>{selectedFile.name}</p>
            <p className="text-xs" style={{ color: theme.mutedTextColor }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="w-full p-4 rounded-xl border-2 border-dashed text-center" style={{ borderColor: theme.borderColor }}>
      <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: theme.mutedTextColor }} />
      <p className="text-xs" style={{ color: theme.mutedTextColor }}>Ningun archivo seleccionado</p>
    </div>
  )
}

function ImportStatsPreview({ importResult }: { importResult: ImportResult }) {
  const theme = useBusinessPanelTheme()
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: theme.cardBg }}><span className="text-sm" style={{ color: theme.subtextColor }}>Total procesados</span><span className="font-bold" style={{ color: theme.textColor }}>{importResult.total}</span></div>
      <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: `color-mix(in srgb, ${theme.successColor} 7.1%, transparent)`, borderColor: `color-mix(in srgb, ${theme.successColor} 14.9%, transparent)` }}><span className="text-sm" style={{ color: theme.successColor }}>Importados</span><span className="font-bold" style={{ color: theme.successColor }}>{importResult.imported}</span></div>
      {importResult.errors > 0 && <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: `color-mix(in srgb, ${theme.dangerColor} 7.1%, transparent)`, borderColor: `color-mix(in srgb, ${theme.dangerColor} 14.9%, transparent)` }}><span className="text-sm" style={{ color: theme.dangerColor }}>Errores</span><span className="font-bold" style={{ color: theme.dangerColor }}>{importResult.errors}</span></div>}
    </div>
  )
}
