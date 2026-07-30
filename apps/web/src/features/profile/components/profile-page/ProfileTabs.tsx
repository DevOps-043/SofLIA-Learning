'use client'

import type React from 'react'
import { motion } from 'framer-motion'
import { Shield, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ProfileTabId } from '../../types/profile.types'
import styles from './ProfileExperience.module.css'

interface ProfileTabsProps {
  activeTab: ProfileTabId
  canEditCredentials: boolean
  setActiveTab: (tab: ProfileTabId) => void
}

export function ProfileTabs({ activeTab, canEditCredentials, setActiveTab }: ProfileTabsProps) {
  const { t } = useTranslation('common')
  const tabs: Array<{ id: ProfileTabId; label: string; icon: React.ReactNode }> = [
    { id: 'personal' as const, label: t('profile.tabs.personal'), icon: <User className="w-4 h-4" /> },
    ...(canEditCredentials
      ? [{ id: 'security' as const, label: t('profile.tabs.security'), icon: <Shield className="w-4 h-4" /> }]
      : [])
  ]
  return (
    <div className={styles.tabsBar} role="tablist" aria-label="Perfil">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <motion.button
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
            whileTap={{ scale: 0.98 }}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </motion.button>
        )
      })}
    </div>
  )
}
