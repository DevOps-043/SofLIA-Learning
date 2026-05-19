'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Settings as SettingsIcon, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BrandingTab } from './BrandingTab'
import { LoginPersonalizadoSection } from './LoginPersonalizadoSection'
import { OrganizationTab } from './OrganizationTab'
import { useBusinessSettingsLogic } from './hooks/useBusinessSettingsLogic'
import { useTranslation } from 'react-i18next'
import { Joyride } from 'react-joyride'
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour'
import { getAdminSettingsSteps, ADMIN_SETTINGS_TOUR_ID } from '@/features/tours/config/business-panel/admin-settings-steps'

export function BusinessSettings() {
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')
  const {
    data,
    isLoading,
    error,
    refetch,
    updateOrganization,
    branding,
    updateBranding,
    activeTab,
    setActiveTab,
    tabs,
    saveSuccess,
    setSaveSuccess,
    saveError,
    setSaveError,
    canUseBranding,
  } = useBusinessSettingsLogic()

  const tourSteps = useMemo(() => getAdminSettingsSteps(t), [t])

  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_SETTINGS_TOUR_ID,
    steps: tourSteps,
    enabled: !isLoading,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 rounded-full"
            style={{
              borderColor: theme.actionSurface,
              borderTopColor: theme.actionColor,
            }}
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <XCircle
              className="w-20 h-20 mx-auto mb-6"
              style={{ color: theme.dangerColor }}
            />
          </motion.div>
          <p
            className="text-xl font-semibold mb-4"
            style={{ color: theme.dangerColor }}
          >
            {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={refetch}
            className="px-6 py-3 rounded-xl font-medium transition-all shadow-lg inline-flex items-center gap-2"
            style={{
              backgroundColor: theme.actionColor,
              color: theme.onActionColor,
              boxShadow: `0 8px 30px color-mix(in srgb, ${theme.actionColor} 20%, transparent)`,
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {joyrideProps.run ? <Joyride {...joyrideProps} /> : null}
    <div className="min-h-screen p-6 lg:p-8 space-y-8">
      <div id="tour-settings-hero">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        className="relative overflow-hidden rounded-3xl p-8 shadow-xl border"
        style={{
          background: theme.heroBackground,
          borderColor: theme.heroBorderColor,
        }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/teams-header.webp"
            alt="Header de configuración"
            fill
            className="object-cover"
            style={{ opacity: theme.isDark ? 0.18 : 0.12 }}
            priority
          />
        </div>

        <div
          className="absolute inset-0 opacity-10 z-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.85) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2.5 rounded-xl backdrop-blur-md border shadow-inner"
              style={{
                backgroundColor: theme.inverseSurface,
                borderColor: theme.inverseBorderColor,
              }}
            >
              <SettingsIcon
                className="w-5 h-5"
                style={{ color: theme.inverseTextColor }}
              />
            </div>
            <span
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: theme.inverseSubtextColor }}
            >
              Panel de Control
            </span>
          </div>

          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight"
            style={{ color: theme.inverseTextColor }}
          >
            Configuración
          </h1>

          <p
            className="text-base max-w-2xl leading-relaxed"
            style={{ color: theme.inverseSubtextColor }}
          >
            Gestiona la configuración de tu organización desde un solo lugar.
          </p>
        </div>
      </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border overflow-hidden backdrop-blur-xl"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div id="tour-settings-tabs">
        <div
          className="flex border-b overflow-x-auto"
          style={{ borderColor: theme.dividerColor }}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <motion.button
                key={tab.id}
                id={tab.id === 'organization' ? 'tour-settings-org-tab' : tab.id === 'branding' ? 'tour-settings-branding-tab' : undefined}
                onClick={() => setActiveTab(tab.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="relative px-6 py-5 font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-3 group"
                style={{
                  color: isActive ? tab.color : theme.subtextColor,
                  backgroundColor: isActive ? `color-mix(in srgb, ${tab.color} 6.3%, transparent)` : 'transparent',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-settings-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tab.color }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <motion.div whileHover={{ scale: 1.06, rotate: 4 }} className="relative">
                  <Icon className="w-5 h-5" />
                </motion.div>

                <span className={isActive ? 'font-semibold' : 'font-medium'}>
                  {tab.label}
                </span>

                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, transparent, color-mix(in srgb, ${tab.color} 6.3%, transparent), transparent)`,
                  }}
                />
              </motion.button>
            )
          })}
        </div>
        </div>

        <div id="tour-settings-content">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {activeTab === 'organization' && (
            <>
              <OrganizationTab
                organization={data.organization}
                updateOrganization={updateOrganization}
                branding={branding}
                updateBranding={updateBranding}
                saveSuccess={saveSuccess}
                setSaveSuccess={setSaveSuccess}
                saveError={saveError}
                setSaveError={setSaveError}
              />

              {data.organization && (
                <div className="mt-8">
                  <LoginPersonalizadoSection
                    organization={data.organization}
                    updateOrganization={updateOrganization}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'branding' && canUseBranding && <BrandingTab />}

          {activeTab === 'branding' && !canUseBranding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle
                  className="w-20 h-20 mx-auto mb-6"
                  style={{ color: theme.warningColor }}
                />
              </motion.div>
              <p
                className="text-xl font-semibold mb-3"
                style={{ color: theme.warningColor }}
              >
                Branding corporativo no disponible
              </p>
              <p
                className="text-base max-w-md mx-auto"
                style={{ color: theme.subtextColor }}
              >
                Esta función solo está disponible en Enterprise. Actualiza tu plan
                para acceder a esta funcionalidad.
              </p>
            </motion.div>
          )}
        </motion.div>
        </div>
      </motion.div>
    </div>
    </>
  )
}
