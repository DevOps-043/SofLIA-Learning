'use client'

import { motion } from 'framer-motion'
import { Shield, User } from 'lucide-react'
import type { ProfileColorPalette, ProfileTabId } from '../../types/profile.types'

const tabs = [
  { id: 'personal' as const, label: 'Información Personal', icon: <User className="w-4 h-4" /> },
  { id: 'security' as const, label: 'Seguridad', icon: <Shield className="w-4 h-4" /> }
]

interface ProfileTabsProps {
  activeTab: ProfileTabId
  setActiveTab: (tab: ProfileTabId) => void
  colors: ProfileColorPalette
}

export function ProfileTabs({ activeTab, setActiveTab, colors }: ProfileTabsProps) {
  return (
    <div className="sticky top-16 z-40 backdrop-blur-xl border-b" style={{ backgroundColor: colors.bgPrimary, borderColor: colors.border }}>
      <div className="px-6 lg:px-12">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar py-3">
          {tabs.map(tab => (
            <motion.button
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
