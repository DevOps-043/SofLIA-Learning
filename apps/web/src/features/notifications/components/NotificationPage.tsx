'use client'

import React, { useMemo, useState } from 'react'
import { Archive, ArrowLeft, Bell, CheckCheck, Inbox, RefreshCw, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, es, pt } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { cn } from '@/shared/utils/cn'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationStatusFilter, useNotificationList } from '../hooks/useNotificationList'
import {
  getNotificationActionUrl,
  NotificationEmptyState,
  NotificationListItem,
  NotificationLoadingState,
} from './notification-ui'
import type { Notification } from '../services/notification.service'

const dateLocales = {
  es,
  en: enUS,
  pt,
}

const statusFilters: Array<{ id: NotificationStatusFilter; labelKey: string; icon: typeof Inbox }> = [
  { id: 'all', labelKey: 'actions.notificationsPage.all', icon: Inbox },
  { id: 'unread', labelKey: 'actions.notificationsPage.unread', icon: Bell },
  { id: 'archived', labelKey: 'actions.notificationsPage.archived', icon: Archive },
]

export function NotificationPage() {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const currentLocale = dateLocales[i18n.language as keyof typeof dateLocales] || es
  const {
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    unreadCount,
  } = useNotifications()
  const {
    notifications,
    isLoading,
    mutate,
    statusFilter,
    setStatusFilter,
    total,
  } = useNotificationList()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return notifications

    return notifications.filter((notification) => {
      const searchableText = `${notification.title} ${notification.message}`.toLowerCase()
      return searchableText.includes(normalizedQuery)
    })
  }, [notifications, searchQuery])

  const runAction = async (action: () => Promise<void> | void) => {
    await action()
    await mutate()
  }

  const openNotification = async (notification: Notification) => {
    if (notification.status === 'unread') {
      await runAction(() => markAsRead(notification.notification_id))
    }

    const actionUrl = getNotificationActionUrl(notification)
    if (actionUrl) {
      router.push(actionUrl)
    }
  }

  const formatTime = (createdAt: string) =>
    formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: currentLocale,
    })

  const emptyDescription = searchQuery
    ? t('actions.notificationsPage.emptySearch', { query: searchQuery })
    : statusFilter === 'unread'
      ? t('actions.notificationsPage.emptyUnread')
      : t('actions.notificationsPage.emptyDefault')

  return (
    <div className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-1 rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary dark:border-white/10 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
              title={t('actions.back')}
              aria-label={t('actions.back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-lg bg-primary/10 p-2 text-primary dark:bg-accent/10 dark:text-accent">
                  <Bell className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-accent">
                  {t('actions.notificationsPage.totalCount', { count: total })}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {t('actions.notificationsPage.title')}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                {unreadCount > 0
                  ? t('actions.notificationsPage.unreadCount', { count: unreadCount })
                  : t('actions.notificationsPage.noUnread')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => runAction(markAllAsRead)}
            disabled={unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-accent dark:text-primary dark:hover:bg-accent/90"
          >
            <CheckCheck className="h-4 w-4" />
            {t('actions.notificationsPage.markAllRead')}
          </button>
        </header>

        <section className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-gray-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">{t('actions.notificationsPage.searchPlaceholder')}</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('actions.notificationsPage.searchPlaceholder')}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900"
              />
            </label>

            <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-900">
              {statusFilters.map((filter) => {
                const Icon = filter.icon
                const isActive = statusFilter === filter.id

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setStatusFilter(filter.id)}
                    className={cn(
                      'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-white text-primary shadow-sm dark:bg-gray-800 dark:text-accent'
                        : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(filter.labelKey)}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-primary dark:border-white/10 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-accent"
              title={t('actions.refresh')}
              aria-label={t('actions.refresh')}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </section>

        <section className="space-y-3">
          {isLoading && notifications.length === 0 ? (
            <NotificationLoadingState label={t('actions.notificationsPage.loading')} />
          ) : filteredNotifications.length === 0 ? (
            <NotificationEmptyState
              title={t('actions.notificationsPage.emptyTitle')}
              description={emptyDescription}
            />
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationListItem
                key={notification.notification_id}
                notification={notification}
                formattedTime={formatTime(notification.created_at)}
                onOpen={openNotification}
                onMarkAsRead={(notificationId) => runAction(() => markAsRead(notificationId))}
                onArchive={(notificationId) => runAction(() => archiveNotification(notificationId))}
                onDelete={(notificationId) => runAction(() => deleteNotification(notificationId))}
              />
            ))
          )}
        </section>
      </div>
    </div>
  )
}
