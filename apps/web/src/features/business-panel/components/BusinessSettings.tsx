'use client'

import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Palette,
  RefreshCw,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useTour } from '@/features/tours'
import { businessPanelSettingsTour } from '@/features/tours/config/business-panel-settings.tour'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { BrandingTab } from './BrandingTab'
import { LoginPersonalizadoSection } from './LoginPersonalizadoSection'
import { OrganizationTab } from './OrganizationTab'
import { useBusinessSettingsLogic } from './hooks/useBusinessSettingsLogic'
import styles from './BusinessSettings.module.css'

export function BusinessSettings() {
  const theme = useBusinessPanelTheme()
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
    if (!isLoading) return autoStartIfNeeded()
  }, [autoStartIfNeeded, isLoading])

  const cssVariables = {
    '--settings-page': theme.panelBg,
    '--settings-card': theme.cardBg,
    '--settings-input': theme.inputBg,
    '--settings-hover': theme.hoverBg,
    '--settings-text': theme.textColor,
    '--settings-muted': theme.subtextColor,
    '--settings-soft': theme.mutedTextColor,
    '--settings-border': theme.borderColor,
    '--settings-divider': theme.dividerColor,
    '--settings-accent': theme.actionColor,
    '--settings-on-accent': theme.onActionColor,
    '--settings-accent-soft': theme.actionSurface,
    '--settings-hero': theme.heroBackground,
    '--settings-hero-text': theme.inverseTextColor,
    '--settings-hero-muted': theme.inverseSubtextColor,
    '--settings-danger': theme.dangerColor,
    '--settings-warning': theme.warningColor,
    '--settings-success': theme.successColor,
  } as CSSProperties

  if (isLoading) {
    return (
      <main className={styles.statePage} style={cssVariables}>
        <div className={styles.loadingMark} aria-label="Cargando configuración">
          <Settings2 aria-hidden="true" />
        </div>
        <p>Preparando la configuración</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.statePage} style={cssVariables}>
        <div className={styles.errorMark}>
          <AlertCircle aria-hidden="true" />
        </div>
        <h1>No pudimos abrir la configuración</h1>
        <p>{error}</p>
        <button type="button" className={styles.primaryButton} onClick={refetch}>
          <RefreshCw aria-hidden="true" />
          Reintentar
        </button>
      </main>
    )
  }

  const activeDescriptor = tabs.find((tab) => tab.id === activeTab)
  const ActiveIcon = activeDescriptor?.icon ?? Building2

  return (
    <>
      <main className={styles.page} style={cssVariables}>
        <header id="tour-settings-hero" className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Settings2 aria-hidden="true" />
              Configuración de la organización
            </span>
            <h1 className={styles.heroTitle}>Un espacio claro para administrar tu operación.</h1>
            <p className={styles.heroSubtitle}>
              Identidad, acceso y marca organizados por intención, sin ruido visual.
            </p>
          </div>
          <div className={styles.heroStatus}>
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Configuración protegida</strong>
              Los cambios se aplican únicamente a esta organización.
            </span>
          </div>
        </header>

        <div id="tour-settings-tabs" className={styles.workspace}>
          <nav className={styles.rail} aria-label="Secciones de configuración">
            <div className={styles.railHeading}>
              <span>Áreas</span>
              <small>{tabs.length.toString().padStart(2, '0')}</small>
            </div>
            <div className={styles.railItems}>
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    className={styles.railItem}
                    data-active={isActive}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className={styles.railIndex}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <span className={styles.railIcon}>
                      <Icon aria-hidden="true" />
                    </span>
                    <span className={styles.railCopy}>
                      <strong>{tab.label}</strong>
                      <small>{tab.description}</small>
                    </span>
                    <ArrowRight className={styles.railArrow} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
            {!canUseBranding && (
              <div className={styles.planNote}>
                <Palette aria-hidden="true" />
                <span>
                  <strong>Marca visual</strong>
                  Disponible con Enterprise.
                </span>
              </div>
            )}
          </nav>

          <section className={styles.canvas} aria-labelledby="settings-section-title">
            <div className={styles.canvasHeader}>
              <span className={styles.canvasIcon}>
                <ActiveIcon aria-hidden="true" />
              </span>
              <div>
                <span className={styles.canvasKicker}>Área activa</span>
                <h2 id="settings-section-title">{activeDescriptor?.label}</h2>
                <p>{activeDescriptor?.description}</p>
              </div>
            </div>

            <div className={styles.canvasBody}>
              {activeTab === 'organization' && (
                <OrganizationTab
                  organization={data.organization}
                  updateOrganization={updateOrganization}
                  branding={branding}
                  updateBranding={updateBranding}
                  showToast={showToast}
                />
              )}

              {activeTab === 'access' && data.organization && (
                <LoginPersonalizadoSection
                  organization={data.organization}
                  updateOrganization={updateOrganization}
                />
              )}

              {activeTab === 'branding' && canUseBranding && <BrandingTab />}
            </div>
          </section>
        </div>
      </main>

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
