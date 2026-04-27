'use client'

import { motion } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'

import { AdminNotifications } from './AdminNotifications'
import { AdminUserDropdown } from './AdminUserDropdown'
import { useAdminUser } from '../hooks/useAdminUser'
import { useAdminTheme } from '../hooks/useAdminTheme'

interface AdminHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function AdminHeader({
  onMenuClick,
  title,
  isCollapsed,
}: AdminHeaderProps) {
  const { user, isLoading } = useAdminUser()
  const theme = useAdminTheme()
  const sidebarWidth = isCollapsed ? 'lg:left-20' : 'lg:left-[280px]'

  return (
    <motion.header
      animate={{ y: 0, opacity: 1 }}
      className={`fixed left-0 right-0 top-0 z-[40] border-b shadow-sm backdrop-blur-md transition-all duration-300 ${sidebarWidth}`}
      initial={{ y: -20, opacity: 0 }}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
      }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:h-20">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <motion.button
              onClick={onMenuClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl p-2 transition-colors lg:hidden"
              style={{ color: theme.textMuted }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = theme.hover
                event.currentTarget.style.color = theme.text
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = 'transparent'
                event.currentTarget.style.color = theme.textMuted
              }}
              aria-label="Abrir navegacion"
            >
              <Bars3Icon className="h-6 w-6" />
            </motion.button>

            <h1 className="truncate text-base font-semibold sm:text-lg" style={{ color: theme.text }}>
              {title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <AdminNotifications />

            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 animate-pulse rounded-full" style={{ backgroundColor: theme.surfaceSubtle }} />
                <div className="hidden md:block">
                  <div className="mb-1 h-4 w-20 animate-pulse rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
                  <div className="h-3 w-16 animate-pulse rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
                </div>
              </div>
            ) : user ? (
              <AdminUserDropdown user={user} />
            ) : (
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full" style={{ backgroundColor: theme.surfaceSubtle }} />
                <div className="hidden md:block">
                  <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
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
