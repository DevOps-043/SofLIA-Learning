'use client'

import { motion } from 'framer-motion'
import { Link2, Mail, Users, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BusinessInviteTabConfig, TabType } from '../../services/business-invite-modal.service'

const TAB_ICONS = {
  Mail,
  Link2,
  Users,
}

interface BusinessInviteModalHeaderProps {
  activeTab: TabType
  tabs: BusinessInviteTabConfig[]
  onClose: () => void
  onTabChange: (tab: TabType) => void
}

export function BusinessInviteModalHeader({
  activeTab,
  tabs,
  onClose,
  onTabChange,
}: BusinessInviteModalHeaderProps) {
  const theme = useBusinessPanelTheme()
  const primarySurface = theme.isDark ? 'rgba(0, 212, 179, 0.14)' : 'rgba(10, 37, 64, 0.08)'

  return (
    <div
      className="shrink-0 border-b p-6"
      style={{
        background: `linear-gradient(135deg, ${theme.hoverBg}, ${theme.inputBg})`,
        borderColor: theme.dividerColor,
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="rounded-xl p-2"
            style={{ backgroundColor: primarySurface }}
          >
            <Users className="h-6 w-6" style={{ color: theme.primaryColor }} />
          </motion.div>

          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>
              Invitar usuarios
            </h3>
            <p className="text-sm" style={{ color: theme.subtextColor }}>
              Invita usuarios individualmente o genera enlaces masivos
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 transition-colors"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(event) => {
            event.currentTarget.style.backgroundColor = theme.hoverBg
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <X className="h-5 w-5" style={{ color: theme.subtextColor }} />
        </button>
      </div>

      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ backgroundColor: theme.inputBg }}
      >
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.icon]
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? theme.cardBg : 'transparent',
                color: isActive ? theme.textColor : theme.subtextColor,
                boxShadow: isActive
                  ? theme.isDark
                    ? '0 8px 20px rgba(0, 0, 0, 0.22)'
                    : '0 8px 20px rgba(15, 23, 42, 0.08)'
                  : 'none',
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span
                  className="ml-1 rounded-full px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: primarySurface,
                    color: theme.primaryColor,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
