'use client'

import { AlertCircle, RefreshCw, Settings as SettingsIcon, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useEffect } from 'react'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useTour } from '@/features/tours'
import { businessPanelSettingsTour } from '@/features/tours/config/business-panel-settings.tour'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BrandingTab } from './BrandingTab'
import { LoginPersonalizadoSection } from './LoginPersonalizadoSection'
import { OrganizationTab } from './OrganizationTab'
import { useBusinessSettingsLogic } from './hooks/useBusinessSettingsLogic'

export function BusinessSettings() {
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')
  const { autoStartIfNeeded } = useTour(businessPanelSettingsTour)
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
    toast,
    showToast,
    hideToast,
    canUseBranding,
  } = useBusinessSettingsLogic()

  useEffect(() => {
    if (!isLoading) {
      return autoStartIfNeeded()
    }
  }, [autoStartIfNeeded, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-center py-32">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin"
            style={{
              borderTopColor: theme.actionColor,
              borderRightColor: theme.actionSurface,
              borderBottomColor: theme.actionSurface,
              borderLeftColor: theme.actionSurface,
            }}
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="text-center py-20">
          <XCircle
            className="w-20 h-20 mx-auto mb-6"
            style={{ color: theme.dangerColor }}
          />
          <p
            className="text-xl font-semibold mb-4"
            style={{ color: theme.dangerColor }}
          >
            {error}
          </p>
          <button
            onClick={refetch}
            className="px-6 py-3 rounded-xl font-medium transition-all shadow-lg inline-flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              backgroundColor: theme.actionColor,
              color: theme.onActionColor,
              boxShadow: `0 8px 30px color-mix(in srgb, ${theme.actionColor} 20%, transparent)`,
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen p-6 lg:p-8 space-y-8">
      <div>
      <div
        id="tour-settings-hero"
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
      </div>
      </div>

      <div
        id="tour-settings-tabs"
        className="rounded-2xl border overflow-hidden backdrop-blur-xl"
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderColor,
        }}
      >
        <div
          className="flex border-b overflow-x-auto"
          style={{ borderColor: theme.dividerColor }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-6 py-5 font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-3"
                style={{
                  color: isActive ? tab.color : theme.subtextColor,
                  backgroundColor: isActive ? `color-mix(in srgb, ${tab.color} 6.3%, transparent)` : 'transparent',
                }}
              >
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tab.color }}
                  />
                )}

                <Icon className="w-5 h-5" />

                <span className={isActive ? 'font-semibold' : 'font-medium'}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="p-8">
          {activeTab === 'organization' && (
            <>
              <OrganizationTab
                organization={data.organization}
                updateOrganization={updateOrganization}
                branding={branding}
                updateBranding={updateBranding}
                showToast={showToast}
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
            <div className="text-center py-20">
              <AlertCircle
                className="w-20 h-20 mx-auto mb-6"
                style={{ color: theme.warningColor }}
              />
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
            </div>
          )}
        </div>
      </div>
    </div>
    <ToastNotification
      isOpen={toast.isOpen}
      onClose={hideToast}
      message={toast.message}
      type={toast.type}
      position="top-right"
    />
    </>
  )
}
