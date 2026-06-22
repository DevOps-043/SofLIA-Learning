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
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useThemeStore } from '@/core/stores/themeStore'

export function BrandingTab() {
  const theme = useBusinessPanelTheme()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
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
    handleToggleBranding,
    openFileDialog,
    handleDropUpload,
  } = useBrandingTabState()

  if (isLoading) {
    return <BrandingLoadingState />
  }

  if (error) {
    return <BrandingErrorState error={error} />
  }

  const brandingEnabled = localBranding.branding_enabled

  return (
    <div className="space-y-6">
      {/* Branding toggle */}
      <div
        className="rounded-xl border p-5 flex items-start gap-5"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: theme.textColor }}>
            Branding personalizado
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.subtextColor }}>
            {brandingEnabled
              ? 'Los colores y estilos de tu organización se aplican a todos los paneles y componentes de usuario.'
              : 'Activá el branding personalizado para reemplazar el tema por defecto de SofLIA con los colores de tu organización.'}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={brandingEnabled}
          onClick={() => handleToggleBranding(!brandingEnabled)}
          className="relative flex-shrink-0 mt-0.5 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{
            backgroundColor: brandingEnabled
              ? theme.actionColor
              : isDark
              ? 'color-mix(in srgb, var(--color-bg-light) 15%, transparent)'
              : 'color-mix(in srgb, var(--color-black) 20%, transparent)',
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{
              transform: brandingEnabled ? 'translateX(24px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {/* Color and logo customization — always visible so admins can preview  */}
      <div
        className="space-y-5 transition-opacity duration-200"
        style={{ opacity: brandingEnabled ? 1 : 0.45 }}
      >
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
      </div>

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
            className="relative overflow-hidden px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
            style={{
              backgroundColor: theme.actionColor,
              boxShadow: `0 8px 30px color-mix(in srgb, ${theme.actionColor} 20%, transparent)`,
              color: theme.onActionColor,
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
