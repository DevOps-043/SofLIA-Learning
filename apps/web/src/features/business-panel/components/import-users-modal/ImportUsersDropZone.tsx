'use client'

import { motion } from 'framer-motion'
import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { ImportUsersModalState } from './import-users.types'

export function ImportUsersDropZone({ state }: { state: ImportUsersModalState }) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <motion.div
      onDragOver={state.handleDragOver}
      onDragLeave={state.handleDragLeave}
      onDrop={state.handleDrop}
      onClick={() => state.fileInputRef.current?.click()}
      className="relative rounded-xl cursor-pointer transition-all duration-200 p-8"
      style={{ border: `2px dashed ${state.isDragging ? theme.primaryColor : theme.borderColor}`, backgroundColor: state.isDragging ? `color-mix(in srgb, ${theme.primaryColor} 6.3%, transparent)` : theme.inputBg }}
    >
      <input ref={state.fileInputRef} type="file" accept=".csv" onChange={state.handleFileInputChange} className="hidden" disabled={state.isImporting} />
      <div className="text-center">
        {state.isImporting ? (
          <div className="space-y-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 mx-auto rounded-full border-[3px] border-t-transparent" style={{ borderColor: `color-mix(in srgb, ${theme.primaryColor} 18.8%, transparent)`, borderTopColor: theme.primaryColor }} />
            <div>
              <p className="font-medium" style={{ color: theme.textColor }}>{t('users.modals.import.loading.title')}</p>
              <p className="text-sm mt-1" style={{ color: theme.mutedTextColor }}>{t('users.modals.import.loading.subtitle')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 8.2%, transparent)` }}>
              <Upload className="w-7 h-7" style={{ color: theme.primaryColor }} />
            </div>
            <p className="font-medium mb-1" style={{ color: theme.textColor }}>{state.isDragging ? t('users.modals.import.dragDrop.drop') : t('users.modals.import.dragDrop.drag')}</p>
            <p className="text-sm" style={{ color: theme.mutedTextColor }}>{t('users.modals.import.dragDrop.orKey')}</p>
          </>
        )}
      </div>
    </motion.div>
  )
}
