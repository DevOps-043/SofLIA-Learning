'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, BellRing, CheckCheck, X } from 'lucide-react'
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
import styles from './NotificationBell.module.css'

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
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLocale = dateLocales[language as keyof typeof dateLocales] || es
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
    <div ref={containerRef} className={cn(styles.root, className)}>
      <motion.button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={styles.trigger}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-label={t('actions.notificationsPage.title')}
        aria-expanded={isDropdownOpen}
      >
        <BellRing className={iconSizes[iconSize]} />

        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {showPulse && criticalCount > 0 && (
          <span className={styles.criticalPulse} aria-hidden="true" />
        )}
      </motion.button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.backdrop}
              onClick={() => setIsDropdownOpen(false)}
              aria-label={t('actions.close')}
            />

            <motion.section
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className={styles.panel}
              role="dialog"
              aria-label={t('actions.notificationsPage.title')}
            >
              <header className={styles.header}>
                <div className={styles.heading}>
                  <h2 className={styles.title}>
                    {t('actions.notificationsPage.title')}
                  </h2>
                  <p className={styles.subtitle}>{unreadLabel}</p>
                </div>

                <div className={styles.headerActions}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        void runAction(markAllAsRead)
                      }}
                      disabled={isLoading}
                      className={`${styles.iconButton} ${styles.iconButtonSuccess}`}
                      title={t('actions.notificationsPage.markAllRead')}
                      aria-label={t('actions.notificationsPage.markAllRead')}
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className={styles.iconButton}
                    title={t('actions.close')}
                    aria-label={t('actions.close')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <div className={styles.viewport}>
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

              <footer className={styles.footer}>
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setIsDropdownOpen(false)}
                  className={styles.viewAll}
                >
                  {t('actions.notificationsPage.viewAll')}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </footer>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
