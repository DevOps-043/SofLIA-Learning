'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { ImportUsersModalState } from './import-users.types'

export function ImportUsersFooter({ state }: { state: ImportUsersModalState }) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="p-4 lg:p-6 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor: theme.borderColor }}>
      {state.importResult ? (
        <>
          <FooterButton onClick={state.handleReset}>{t('users.buttons.importAnother')}</FooterButton>
          <PrimaryFooterButton onClick={state.handleClose}>{t('users.buttons.finish')}</PrimaryFooterButton>
        </>
      ) : (
        <>
          <FooterButton onClick={state.handleClose} disabled={state.isImporting}>{t('users.buttons.cancel')}</FooterButton>
          <PrimaryFooterButton onClick={state.processFile} disabled={!state.selectedFile || state.isImporting} enabled={Boolean(state.selectedFile)}>
            {state.isImporting ? t('users.modals.import.loading.title') : t('users.buttons.import')}
          </PrimaryFooterButton>
        </>
      )}
    </div>
  )
}

function FooterButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  const theme = useBusinessPanelTheme()
  return <button onClick={onClick} disabled={disabled} className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50" style={{ color: theme.mutedTextColor, backgroundColor: theme.inputBg }}>{children}</button>
}

function PrimaryFooterButton({ children, disabled, enabled = true, onClick }: { children: ReactNode; disabled?: boolean; enabled?: boolean; onClick: () => void | Promise<void> }) {
  const theme = useBusinessPanelTheme()
  return (
    <motion.button
      whileHover={{ scale: enabled ? 1.02 : 1 }}
      whileTap={{ scale: enabled ? 0.98 : 1 }}
      onClick={() => void onClick()}
      disabled={disabled}
      className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: enabled ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` : theme.inputBg, color: enabled ? theme.onPrimaryColor : theme.mutedTextColor, boxShadow: enabled ? `0 4px 15px color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)` : 'none' }}
    >
      {children}
    </motion.button>
  )
}
