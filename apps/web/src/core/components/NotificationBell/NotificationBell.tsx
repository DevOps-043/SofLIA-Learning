'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, es, pt } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { useLanguage } from '@/core/providers/I18nProvider'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import {
  getNotificationActionUrl,
  NotificationEmptyState,
  NotificationListItem,
  NotificationLoadingState,
} from '@/features/notifications/components/notification-ui'
import type { Notification } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'
import { cn } from '@/shared/utils/cn'
import { useThemeStore } from '@/core/stores/themeStore'

export interface NotificationBellProps {
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
  showPulse?: boolean
  variant?: 'default' | 'compact'
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const dateLocales = {
  es,
  en: enUS,
  pt,
}

export function NotificationBell({
  className,
  iconSize = 'md',
  showPulse = true,
}: NotificationBellProps) {
  const {
    notifications,
    unreadCount,
    criticalCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    isDropdownOpen,
    setIsDropdownOpen,
  } = useNotifications()
  const { t } = useTranslation('common')
  const { language } = useLanguage()
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLocale = dateLocales[language as keyof typeof dateLocales] || es
  const isLightMode = resolvedTheme === 'light'
  const headingColor = isLightMode ? 'var(--color-legacy-0f172a)' : undefined
  const mutedTextColor = isLightMode ? 'var(--color-legacy-334155)' : undefined

  useEffect(() => {
    if (!isDropdownOpen) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (!containerRef.current?.contains(target)) {
        setIsDropdownOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isDropdownOpen, setIsDropdownOpen])

  const unreadLabel = useMemo(() => {
    if (unreadCount === 0) return t('actions.notificationsPage.noUnread')
    return t('actions.notificationsPage.unreadCount', { count: unreadCount })
  }, [t, unreadCount])

  const runAction = async (action: () => Promise<void> | void) => {
    try {
      await action()
    } catch (error) {
      logger.error('Notification action failed', error)
    }
  }

  const openNotification = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await runAction(() => markAsRead(notification.notification_id))
    }

    const actionUrl = getNotificationActionUrl(notification)
    if (actionUrl) {
      setIsDropdownOpen(false)
      router.push(actionUrl)
    }
  }

  const formatTime = (createdAt: string) =>
    formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: currentLocale,
    })

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <motion.button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative rounded-lg p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-accent"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label={t('actions.notificationsPage.title')}
        aria-expanded={isDropdownOpen}
      >
        <Bell className={iconSizes[iconSize]} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-white shadow-sm dark:bg-accent dark:text-primary">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {showPulse && criticalCount > 0 && (
          <span className="absolute inset-1 rounded-lg border border-error/40 animate-pulse" aria-hidden="true" />
        )}
      </motion.button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-gray-950/30 backdrop-blur-[2px] sm:hidden"
              onClick={() => setIsDropdownOpen(false)}
            />

            <motion.section
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-x-3 top-20 z-[100] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-gray-800 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[28rem]"
              role="dialog"
              aria-label={t('actions.notificationsPage.title')}
            >
              <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-white/10">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white" style={{ color: headingColor }}>
                    {t('actions.notificationsPage.title')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400" style={{ color: mutedTextColor }}>{unreadLabel}</p>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        void runAction(markAllAsRead)
                      }}
                      disabled={isLoading}
                      className="rounded-md p-2 text-gray-500 transition-colors hover:bg-success/10 hover:text-success disabled:opacity-50 dark:text-gray-400"
                      title={t('actions.notificationsPage.markAllRead')}
                      aria-label={t('actions.notificationsPage.markAllRead')}
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                    title={t('actions.close')}
                    aria-label={t('actions.close')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <div className="max-h-[min(28rem,calc(100vh-12rem))] overflow-y-auto scrollbar-thin">
                {isLoading && notifications.length === 0 ? (
                  <NotificationLoadingState label={t('actions.notificationsPage.loading')} compact />
                ) : notifications.length === 0 ? (
                  <NotificationEmptyState
                    title={t('actions.notificationsPage.emptyTitle')}
                    description={t('actions.notificationsPage.emptyDefault')}
                    compact
                  />
                ) : (
                  notifications.map((notification) => (
                    <NotificationListItem
                      key={notification.notification_id}
                      notification={notification}
                      formattedTime={formatTime(notification.created_at)}
                      layout="compact"
                      onOpen={openNotification}
                      onMarkAsRead={markAsRead}
                      onArchive={archiveNotification}
                      onDelete={deleteNotification}
                    />
                  ))
                )}
              </div>

              <footer className="border-t border-gray-200 px-4 py-3 dark:border-white/10">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 dark:text-accent dark:hover:bg-accent/10"
                >
                  {t('actions.notificationsPage.viewAll')}
                </Link>
              </footer>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
