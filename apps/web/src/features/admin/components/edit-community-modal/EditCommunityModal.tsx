'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Edit3, Save, Shield, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunity } from '../../services/adminCommunities.service'
import { CommunityFormSections } from './CommunityFormSections'
import { useEditCommunityFormState } from './useEditCommunityFormState'

interface EditCommunityModalProps {
  community: AdminCommunity | null
  isOpen: boolean
  onClose: () => void
  onSave: (
    communityData: ReturnType<typeof useEditCommunityFormState>['formData'],
  ) => Promise<void>
}

export function EditCommunityModal({
  community,
  isOpen,
  onClose,
  onSave,
}: EditCommunityModalProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()
  const {
    formData,
    errors,
    isLoading,
    error,
    setFieldValue,
    handleSubmit,
  } = useEditCommunityFormState({
    community,
    onSave,
    onClose,
  })

  if (!isOpen || !community) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            style={{ backgroundColor: theme.overlayBg }}
            transition={{ duration: 0.2 }}
          />

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(event) => event.stopPropagation()}
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div
                  className="relative border-b px-6 py-4"
                  style={{
                    background: theme.heroBackground,
                    borderColor: theme.heroBorderColor,
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: theme.inverseSurface }}
                      >
                        <Edit3
                          className="h-5 w-5"
                          style={{ color: theme.accentColor }}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-bold"
                          style={{ color: theme.inverseTextColor }}
                        >
                          {t('communities.editModal.title')}
                        </h3>
                        <p
                          className="text-xs"
                          style={{ color: theme.inverseSubtextColor }}
                        >
                          {t('communities.editModal.description', {
                            name: community.name,
                          })}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      className="rounded-lg p-2 transition-colors duration-200"
                      disabled={isLoading}
                      onClick={onClose}
                      style={{ color: theme.inverseSubtextColor }}
                      type="button"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                <form className="flex-1 overflow-y-auto" onSubmit={handleSubmit}>
                  <div className="space-y-5 p-6">
                    {error ? (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-xl border p-4"
                        initial={{ opacity: 0, y: -10 }}
                        style={{
                          backgroundColor: `${theme.dangerColor}14`,
                          borderColor: `${theme.dangerColor}26`,
                        }}
                      >
                        <AlertCircle
                          className="h-5 w-5"
                          style={{ color: theme.dangerColor }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: theme.dangerColor }}
                        >
                          {error}
                        </p>
                      </motion.div>
                    ) : null}

                    <CommunityFormSections
                      errors={errors}
                      formData={formData}
                      isDisabled={isLoading}
                      onFieldChange={setFieldValue}
                    />
                  </div>

                  <div
                    className="flex flex-col gap-4 border-t px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
                    style={{
                      backgroundColor: theme.inputBg,
                      borderColor: theme.borderColor,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="rounded-lg p-2"
                        style={{ backgroundColor: theme.actionSurface }}
                      >
                        <Shield
                          className="h-4 w-4"
                          style={{ color: theme.primaryColor }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: theme.primaryColor }}
                        >
                          {t('communities.editModal.auditTitle')}
                        </p>
                        <p
                          className="mt-1 text-xs leading-relaxed"
                          style={{ color: theme.subtextColor }}
                        >
                          {t('communities.editModal.auditDescription')}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <motion.button
                        className="rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors duration-200"
                        disabled={isLoading}
                        onClick={onClose}
                        style={{
                          backgroundColor: theme.cardBg,
                          borderColor: theme.borderColor,
                          color: theme.subtextColor,
                        }}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {tc('actions.cancel')}
                      </motion.button>
                      <motion.button
                        className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-lg transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                        style={{
                          backgroundColor: theme.primaryColor,
                          color: theme.onPrimaryColor,
                        }}
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isLoading ? (
                          <>
                            <span
                              className="h-4 w-4 animate-spin rounded-full border-2"
                              style={{
                                borderColor: theme.inverseBorderColor,
                                borderTopColor: theme.onPrimaryColor,
                              }}
                            />
                            <span>{t('communities.editModal.saving')}</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            <span>{t('communities.editModal.saveButton')}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
