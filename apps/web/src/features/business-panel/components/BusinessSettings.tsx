'use client'

import { motion } from 'framer-motion'
import { Settings as SettingsIcon, XCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useBusinessSettingsLogic } from './hooks/useBusinessSettingsLogic'
import { OrganizationTab } from './OrganizationTab'
import { LoginPersonalizadoSection } from './LoginPersonalizadoSection'
import { PersonalizationTab } from './PersonalizationTab'
import { BrandingTab } from './BrandingTab'

export function BusinessSettings() {
  const {
    data,
    isLoading,
    error,
    refetch,
    updateOrganization,
    branding,
    isLoadingBranding,
    updateBranding,
    detectColors,
    refetchStyles,
    orgSlug,
    isDark,
    activeTab,
    setActiveTab,
    tabs,
    saveSuccess,
    setSaveSuccess,
    saveError,
    setSaveError,
    canUseBranding,
    isEnterprise,
  } = useBusinessSettingsLogic()

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 rounded-full"
            style={{
              borderColor: 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.2)',
              borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
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
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          </motion.div>
          <p className="text-red-400 text-xl font-semibold mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refetch}
            className="px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff'
            }}
          >
            Reintentar
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-8">
      {/* Hero Header - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative overflow-hidden rounded-3xl p-8 shadow-xl"
        style={{
          backgroundColor: '#0A2540',
        }}
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/teams-header.png"
            alt="Settings Header"
            fill
            className="object-cover"
            style={{ opacity: 0.5 }}
            priority
          />
        </div>
        
        {/* Blue Gradient Overlay - Crucial for the 'Blue' look while keeping image visible */}
        <div 
            className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/90 via-[#0A2540]/50 to-transparent z-0 pointer-events-none"
        />

        {/* Decorative Particles/Grid - Subtle */}
        <div 
          className="absolute inset-0 opacity-10 z-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />

        {/* Content Layer */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <SettingsIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </div>
            <span 
              className="text-sm font-bold tracking-widest uppercase drop-shadow-sm"
              style={{ color: 'rgba(219, 234, 254, 0.9)' }}
            >
              Panel de Control
            </span>
          </div>
          
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Configuración
          </h1>
          
          <p 
            className="text-base max-w-2xl leading-relaxed drop-shadow-sm"
            style={{ color: '#EFF6FF' }}
          >
            Gestiona las configuraciones de tu organización
          </p>
        </div>
      </motion.div>

      {/* Premium Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border overflow-hidden backdrop-blur-xl bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        {/* Tab Navigation */}
        <div className="flex border-b overflow-x-auto border-gray-200 dark:border-slate-700/30">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative px-6 py-5 font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-white/5
                  ${isActive ? '' : 'text-gray-500 dark:text-gray-400'}
                `}
                style={isActive ? { color: tab.color } : {}}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tab.color }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon with glow effect */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative"
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.5, scale: 1.5 }}
                      className="absolute inset-0 blur-md"
                      style={{ backgroundColor: tab.color }}
                    />
                  )}
                </motion.div>

                <span className={`transition-all ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>

                {/* Hover effect indicator */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, transparent, ${tab.color}10, transparent)`
                  }}
                />
              </motion.button>
            )
          })}
        </div>

        {/* Tab Content with Animation */}
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
              {/* Sección de Login Personalizado y SSO */}
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
          {activeTab === 'branding' && canUseBranding && (
            <BrandingTab />
          )}
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
                <AlertCircle className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
              </motion.div>
              <p className="text-yellow-400 text-xl font-semibold mb-3">Branding Corporativo No Disponible</p>
              <p className="text-white/60 text-base max-w-md mx-auto">
                Esta función solo está disponible en Enterprise. Actualiza tu plan para acceder a esta funcionalidad.
              </p>
            </motion.div>
          )}
          {activeTab === 'personalization' && isEnterprise && (
            <PersonalizationTab
              organization={data.organization}
              updateOrganization={updateOrganization}
              saveSuccess={saveSuccess}
              setSaveSuccess={setSaveSuccess}
              saveError={saveError}
              setSaveError={setSaveError}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

