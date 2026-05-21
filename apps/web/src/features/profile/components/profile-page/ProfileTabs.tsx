'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Shield, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PROFILE_TOUR_TARGET_IDS } from '../../../../core/constants/tourTargets'
import type { ProfileColorPalette, ProfileTabId } from '../../types/profile.types'

interface ProfileTabsProps {
  activeTab: ProfileTabId
  canEditCredentials: boolean
  setActiveTab: (tab: ProfileTabId) => void
  colors: ProfileColorPalette
}

export function ProfileTabs({ activeTab, canEditCredentials, setActiveTab, colors }: ProfileTabsProps) {
  const { t } = useTranslation('common')
  const tabs: Array<{ id: ProfileTabId; label: string; icon: React.ReactNode }> = [
    { id: 'personal' as const, label: t('profile.tabs.personal'), icon: <User className="w-4 h-4" /> },
    ...(canEditCredentials
      ? [{ id: 'security' as const, label: t('profile.tabs.security'), icon: <Shield className="w-4 h-4" /> }]
      : [])
  ]
  return (
    <div id={PROFILE_TOUR_TARGET_IDS.tabs} className="sticky top-16 z-40 backdrop-blur-xl border-b" style={{ backgroundColor: colors.bgPrimary, borderColor: colors.border }}>
      <div className="px-6 lg:px-12">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar py-3">
          {tabs.map(tab => (
            <motion.button
              id={tab.id === 'security' ? PROFILE_TOUR_TARGET_IDS.securitySection : undefined}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200"
              style={{
                backgroundColor: activeTab === tab.id ? colors.bgSecondary : 'transparent',
                color: activeTab === tab.id ? colors.accent : colors.textSecondary
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
