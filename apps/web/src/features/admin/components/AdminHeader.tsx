'use client'

import { motion } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { AdminUserDropdown } from './AdminUserDropdown'
import { AdminNotifications } from './AdminNotifications'
import { useAdminUser } from '../hooks/useAdminUser'
import { useOrganizationStylesContext } from '../../business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface AdminHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function AdminHeader({ onMenuClick, title, isCollapsed, onToggleCollapse }: AdminHeaderProps) {
  const { user, isLoading } = useAdminUser()
  
  // Obtener tema del usuario (light/dark)
  const { resolvedTheme } = useThemeStore()
  const isLightTheme = resolvedTheme === 'light'
  
  // Colores del tema
  const themeColors = {
    // Fondo sólido sin transparencia/blur
    background: isLightTheme ? '#FFFFFF' : '#0F1419',
    borderColor: isLightTheme ? '#E2E8F0' : '#334155',
    textPrimary: isLightTheme ? '#0A2540' : '#FFFFFF',
    textSecondary: isLightTheme ? '#6C757D' : '#9CA3AF',
    hoverBg: isLightTheme ? '#F1F5F9' : 'rgba(10, 37, 64, 0.2)',
  }

  const sidebarWidth = isCollapsed ? 'lg:left-16' : 'lg:left-64'

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 right-0 z-[40] shadow-sm border-b transition-all duration-300 ${sidebarWidth} left-0 backdrop-blur-md`}
      style={{ 
        backgroundColor: isLightTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 20, 25, 0.8)',
        borderColor: themeColors.borderColor
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onMenuClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: themeColors.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themeColors.hoverBg;
                e.currentTarget.style.color = themeColors.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = themeColors.textSecondary;
              }}
            >
              <Bars3Icon className="h-6 w-6" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <h1 className="text-lg font-semibold" style={{ color: themeColors.textPrimary }}>
                  {title}
                </h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-semibold" style={{ color: themeColors.textPrimary }}>
                  {title}
                </h1>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <AdminNotifications />

            {/* User Menu */}
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full animate-pulse" style={{ backgroundColor: isLightTheme ? '#E9ECEF' : '#1E2329' }}></div>
                <div className="hidden md:block">
                  <div className="w-20 h-4 rounded animate-pulse mb-1" style={{ backgroundColor: isLightTheme ? '#E9ECEF' : '#1E2329' }}></div>
                  <div className="w-16 h-3 rounded animate-pulse" style={{ backgroundColor: isLightTheme ? '#E9ECEF' : '#1E2329' }}></div>
                </div>
              </div>
            ) : user ? (
              <AdminUserDropdown user={user} />
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full" style={{ backgroundColor: isLightTheme ? '#E9ECEF' : '#1E2329' }}></div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>
                    Usuario no encontrado
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
