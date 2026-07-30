'use client'

import React, { useState } from 'react'
import { Archive, BellDot, Check, ChevronRight, Loader2, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Notification } from '../services/notification.service'
import {
  getNotificationBgColor,
  getNotificationBorderColor,
  getNotificationIcon,
  getNotificationTextColor,
} from '../utils/notification-categories'
import { logger } from '@/lib/logger'
import { cn } from '@/shared/utils/cn'
import styles from './NotificationUi.module.css'

export function getNotificationActionUrl(notification: Pick<Notification, 'metadata'>): string | null {
  const actionUrl = notification.metadata?.action_url
  const legacyActionUrl = notification.metadata?.actionUrl
  const legacyUrl = notification.metadata?.url
  const candidate =
    typeof actionUrl === 'string'
      ? actionUrl
      : typeof legacyActionUrl === 'string'
        ? legacyActionUrl
        : typeof legacyUrl === 'string'
          ? legacyUrl
          : null

  if (!candidate) return null

  const normalizedUrl = candidate.trim()
  if (!normalizedUrl.startsWith('/') || normalizedUrl.startsWith('//')) {
    return null
  }

  return normalizedUrl
}

export function getNotificationText(
  notification: Pick<Notification, 'metadata'>,
  value: string,
  translate: (key: string, options?: Record<string, unknown>) => string,
) {
  return notification.metadata?.is_localized
    ? translate(value, notification.metadata)
    : value
}

interface NotificationListItemProps {
  notification: Notification
  formattedTime: string
  layout?: 'compact' | 'comfortable'
  showActions?: boolean
  onOpen?: (notification: Notification) => Promise<void> | void
  onMarkAsRead?: (notificationId: string) => Promise<void> | void
  onArchive?: (notificationId: string) => Promise<void> | void
  onDelete?: (notificationId: string) => Promise<void> | void
}

export function NotificationListItem({
  notification,
  formattedTime,
  layout = 'comfortable',
  showActions = true,
  onOpen,
  onMarkAsRead,
  onArchive,
  onDelete,
}: NotificationListItemProps) {
  const { t } = useTranslation('common')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const Icon = getNotificationIcon(notification.notification_type)
  const isUnread = notification.status === 'unread'
  const hasActionUrl = Boolean(getNotificationActionUrl(notification))
  const isCompact = layout === 'compact'
  const stop = (event: React.MouseEvent) => {
    event.stopPropagation()
  }
  const runAction = (action: (() => Promise<void> | void) | undefined) => {
    if (!action) return

    void Promise.resolve(action()).catch((error) => {
      logger.error('Notification action failed', error)
    })
  }
  const handleDelete = () => {
    if (isDeleting || !onDelete) return
    setIsDeleting(true)
    void Promise.resolve(onDelete(notification.notification_id))
      .catch((err) => logger.error('Notification delete failed', err))
      .finally(() => setIsDeleting(false))
  }

  return (
    <article
      onClick={() => runAction(() => onOpen?.(notification))}
      className={cn(
        'group',
        styles.item,
        isCompact ? styles.compact : styles.comfortable,
        isUnread && styles.unread,
      )}
    >
      {isUnread && (
        <span className={styles.unreadRail} aria-hidden="true" />
      )}

      <div className={cn(styles.iconShell, getNotificationBgColor(notification.notification_type))}>
        <Icon className={cn(isCompact ? 'h-4 w-4' : 'h-5 w-5', getNotificationTextColor(notification.notification_type))} />
      </div>

      <div className={styles.content}>
        <div className={styles.topline}>
          <div className={styles.copy}>
            <h3
              className={styles.title}
            >
              {getNotificationText(notification, notification.title, t)}
            </h3>
            <p
              className={styles.message}
            >
              {getNotificationText(notification, notification.message, t)}
            </p>
          </div>

          <time className={styles.time}>
            {formattedTime}
          </time>
        </div>

        <div className={styles.meta}>
          <div className={styles.priority}>
            <span className={cn(styles.priorityDot, getNotificationBorderColor(notification.notification_type).replace('border-l-', 'border-'))} />
            <span>
              {t(`actions.notificationsPage.priority.${notification.priority}`, {
                defaultValue: notification.priority,
              })}
            </span>
          </div>

          {showActions && (
            <div className={styles.actions} onClick={stop}>
              {isUnread && onMarkAsRead && (
                <button
                  type="button"
                  onClick={() => runAction(() => onMarkAsRead(notification.notification_id))}
                  className={`${styles.actionButton} ${styles.actionSuccess}`}
                  title={t('actions.markAsRead')}
                  aria-label={t('actions.markAsRead')}
                >
                  <Check className="h-4 w-4" />
                </button>
              )}

              {onArchive && notification.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => runAction(() => onArchive(notification.notification_id))}
                  className={styles.actionButton}
                  title={t('actions.archive')}
                  aria-label={t('actions.archive')}
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}

              {onDelete && (
                isConfirmingDelete ? (
                  <div className={styles.confirmDelete}>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className={`${styles.actionButton} ${styles.actionDanger}`}
                      title={t('actions.confirm')}
                      aria-label={t('actions.confirm')}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className={styles.actionButton}
                      title={t('actions.cancel')}
                      aria-label={t('actions.cancel')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className={`${styles.actionButton} ${styles.actionDanger}`}
                    title={t('actions.delete')}
                    aria-label={t('actions.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              )}

              {hasActionUrl && (
                <ChevronRight className={`${styles.actionArrow} h-4 w-4`} aria-hidden="true" />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

interface NotificationEmptyStateProps {
  title: string
  description: string
  compact?: boolean
}

export function NotificationEmptyState({ title, description, compact = false }: NotificationEmptyStateProps) {
  return (
    <div className={cn(styles.state, !compact && styles.stateComfortable)}>
      <div className={styles.stateIcon}>
        <BellDot className="h-5 w-5" />
      </div>
      <h3 className={styles.stateTitle}>{title}</h3>
      <p className={styles.stateDescription}>{description}</p>
    </div>
  )
}

export function NotificationLoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={cn(styles.state, !compact && styles.stateComfortable)}>
      <Loader2
        className={`${styles.loader} h-7 w-7 animate-spin`}
      />
      <p className={styles.stateDescription}>{label}</p>
    </div>
  )
}
