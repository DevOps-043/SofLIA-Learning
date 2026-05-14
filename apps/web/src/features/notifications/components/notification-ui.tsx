'use client'

import React, { useState } from 'react'
import { Bell, Check, ChevronRight, Loader2, Trash2, Archive, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Notification } from '../services/notification.service'
import {
  getNotificationBgColor,
  getNotificationBorderColor,
  getNotificationIcon,
  getNotificationTextColor,
} from '../utils/notification-categories'
import { cn } from '@/shared/utils/cn'

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
  onOpen?: (notification: Notification) => void
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
  const Icon = getNotificationIcon(notification.notification_type)
  const isUnread = notification.status === 'unread'
  const hasActionUrl = Boolean(getNotificationActionUrl(notification))
  const isCompact = layout === 'compact'

  const stop = (event: React.MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <article
      onClick={() => onOpen?.(notification)}
      className={cn(
        'group relative flex w-full cursor-pointer gap-3 border bg-white text-left shadow-sm transition-colors dark:bg-gray-800',
        isCompact ? 'items-start rounded-none border-x-0 border-t-0 px-4 py-3' : 'items-center rounded-lg p-4',
        isUnread
          ? 'border-primary/20 bg-gray-50 dark:border-accent/30 dark:bg-gray-800'
          : 'border-gray-200 dark:border-white/10',
        'hover:border-accent/40 hover:bg-gray-50 dark:hover:bg-gray-700/60',
      )}
    >
      {isUnread && (
        <span
          className={cn(
            'absolute left-0 top-0 h-full w-1 bg-accent',
            isCompact ? '' : 'rounded-l-lg',
          )}
          aria-hidden="true"
        />
      )}

      <div className={cn('shrink-0 rounded-lg', getNotificationBgColor(notification.notification_type), isCompact ? 'p-2' : 'p-3')}>
        <Icon className={cn(isCompact ? 'h-4 w-4' : 'h-5 w-5', getNotificationTextColor(notification.notification_type))} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                'truncate font-semibold leading-snug',
                isCompact ? 'text-sm' : 'text-sm sm:text-base',
                isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
              )}
            >
              {getNotificationText(notification, notification.title, t)}
            </h3>
            <p
              className={cn(
                'mt-1 text-gray-600 dark:text-gray-400',
                isCompact ? 'line-clamp-2 text-xs' : 'line-clamp-2 text-sm',
              )}
            >
              {getNotificationText(notification, notification.message, t)}
            </p>
          </div>

          <time className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {formattedTime}
          </time>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full border', getNotificationBorderColor(notification.notification_type).replace('border-l-', 'border-'))} />
            <span className="text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
              {t(`actions.notificationsPage.priority.${notification.priority}`, {
                defaultValue: notification.priority,
              })}
            </span>
          </div>

          {showActions && (
            <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-70 sm:transition-opacity sm:group-hover:opacity-100" onClick={stop}>
              {isUnread && onMarkAsRead && (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(notification.notification_id)}
                  className="rounded-md p-2 text-gray-500 transition-colors hover:bg-success/10 hover:text-success dark:text-gray-400"
                  title={t('actions.markAsRead')}
                  aria-label={t('actions.markAsRead')}
                >
                  <Check className="h-4 w-4" />
                </button>
              )}

              {onArchive && notification.status !== 'archived' && (
                <button
                  type="button"
                  onClick={() => onArchive(notification.notification_id)}
                  className="rounded-md p-2 text-gray-500 transition-colors hover:bg-primary/10 hover:text-primary dark:text-gray-400 dark:hover:text-accent"
                  title={t('actions.archive')}
                  aria-label={t('actions.archive')}
                >
                  <Archive className="h-4 w-4" />
                </button>
              )}

              {onDelete && (
                isConfirmingDelete ? (
                  <div className="flex items-center gap-1 rounded-md bg-error/10 p-1">
                    <button
                      type="button"
                      onClick={() => onDelete(notification.notification_id)}
                      className="rounded p-1 text-error transition-colors hover:bg-error/10"
                      title={t('actions.confirm')}
                      aria-label={t('actions.confirm')}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
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
                    className="rounded-md p-2 text-gray-500 transition-colors hover:bg-error/10 hover:text-error dark:text-gray-400"
                    title={t('actions.delete')}
                    aria-label={t('actions.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              )}

              {hasActionUrl && (
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
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
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-6 py-10' : 'rounded-lg border border-gray-200 bg-white px-6 py-16 dark:border-white/10 dark:bg-gray-800')}>
      <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-700">
        <Bell className="h-7 w-7 text-gray-500 dark:text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

export function NotificationLoadingState({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'px-6 py-10' : 'rounded-lg border border-gray-200 bg-white px-6 py-16 dark:border-white/10 dark:bg-gray-800')}>
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent" />
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  )
}
