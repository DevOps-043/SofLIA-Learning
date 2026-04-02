'use client'

import { motion } from 'framer-motion'
import {
  BrandingColorsCard,
  BrandingErrorState,
  BrandingFaviconCard,
  BrandingFeedbackMessages,
  BrandingLoadingState,
  BrandingLogoCard,
  useBrandingTabState,
} from './branding-tab'

export function BrandingTab() {
  const {
    isLoading,
    error,
    isSaving,
    isDetecting,
    saveSuccess,
    saveError,
    localBranding,
    setLocalBranding,
    handleSave,
    handleDetectColors,
    openFileDialog,
    handleDropUpload,
  } = useBrandingTabState()

  if (isLoading) {
    return <BrandingLoadingState />
  }

  if (error) {
    return <BrandingErrorState error={error} />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BrandingLogoCard
          branding={localBranding}
          isDetecting={isDetecting}
          onUpload={() => openFileDialog('Logo-Empresa', 'banner_url')}
          onDropUpload={(file) =>
            void handleDropUpload(file, 'Logo-Empresa', 'banner_url')
          }
        />

        <BrandingFaviconCard
          branding={localBranding}
          onUpload={() => openFileDialog('Favicon', 'favicon_url')}
        />
      </div>

      <BrandingColorsCard
        branding={localBranding}
        isDetecting={isDetecting}
        onDetectColors={() => void handleDetectColors()}
        onColorChange={(key, value) =>
          setLocalBranding((current) => ({
            ...current,
            [key]: value,
          }))
        }
      />

      <div className="space-y-4">
        <BrandingFeedbackMessages
          saveSuccess={saveSuccess}
          saveError={saveError}
        />

        <div className="flex justify-end">
          <motion.button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
            className="relative overflow-hidden px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})`,
              boxShadow: `0 8px 30px ${localBranding.color_primary}40`,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            <motion.div
              className="absolute inset-0 w-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
            />

            <div className="relative flex items-center gap-2.5">
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
