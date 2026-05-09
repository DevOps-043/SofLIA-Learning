'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  X, 
  Clock, 
  ChevronRight,
  MoreVertical,
  CheckCheck,
  AlertCircle,
  Inbox,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS, pt } from 'date-fns/locale'
import { useNotifications } from '../hooks/useNotifications'
import { useNotificationList, NotificationStatusFilter } from '../hooks/useNotificationList'
import { cn } from '@/shared/utils/cn'
import { 
  getNotificationIcon, 
  getNotificationBgColor, 
  getNotificationTextColor,
  getNotificationBorderColor
} from '../utils/notification-categories'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const dateLocales = {
  es,
  en: enUS,
  pt
}

export function NotificationPage() {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const currentLocale = (dateLocales[i18n.language as keyof typeof dateLocales] || es) as any
  
  const { 
    markAsRead, 
    markAllAsRead, 
    archiveNotification, 
    deleteNotification,
    unreadCount 
  } = useNotifications()
  
  const { 
    notifications, 
    isLoading, 
    mutate, 
    statusFilter, 
    setStatusFilter 
  } = useNotificationList()

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isMounted, setIsMounted] = useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredNotifications = notifications.filter(n => {
    const searchContent = `${n.title} ${n.message}`.toLowerCase()
    return searchContent.includes(searchQuery.toLowerCase())
  })

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action()
      await mutate()
    } catch (error) {
      console.error('Error executing notification action:', error)
    }
  }

  const handleNotificationClick = async (n: any) => {
    if (n.status === 'unread') {
      await handleAction(() => markAsRead(n.notification_id))
    }
    
    if (n.metadata?.action_url) {
      router.push(n.metadata.action_url)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F1419] transition-colors duration-300 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00D4B3]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0A2540]/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <header className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => router.back()}
                className="p-2.5 bg-white dark:bg-white/5 text-[#6C757D] dark:text-gray-400 rounded-xl hover:text-[#0A2540] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5"
                title={isMounted ? t('actions.back') : ''}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-4 bg-gradient-to-br from-[#0A2540] to-[#1E293B] dark:from-[#00D4B3] dark:to-[#00A896] rounded-2xl shadow-2xl shadow-primary/20 ring-4 ring-white dark:ring-white/10">
                <Bell className="w-8 h-8 text-white dark:text-[#0A2540]" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#0A2540] dark:text-white tracking-tight uppercase italic">
                  {isMounted ? t('actions.notificationsPage.title') : '...'}
                </h1>
                <p className="text-[#6C757D] dark:text-gray-400 font-medium">
                  {isMounted ? (
                    unreadCount > 0 
                      ? t('actions.notificationsPage.subtitle')
                      : t('actions.notificationsPage.noNotifications')
                  ) : '...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(markAllAsRead)}
                disabled={unreadCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0A2540] dark:bg-[#00D4B3] text-white dark:text-[#0A2540] rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-[#0A2540]/10 dark:shadow-[#00D4B3]/10"
              >
                <CheckCheck className="w-4 h-4" />
                {isMounted ? t('actions.notificationsPage.markAllRead') : '...'}
              </button>
            </div>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-white/5 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            
            {/* Search */}
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C757D] dark:text-gray-500" />
              <input
                type="text"
                placeholder={isMounted ? t('actions.notificationsPage.searchPlaceholder') : '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-[#0A2540]/30 border border-[#E9ECEF] dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4B3]/50 focus:border-[#00D4B3] outline-none transition-all dark:text-white"
              />
            </div>

            {/* Tab Filters */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-[#0A2540]/50 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: isMounted ? t('actions.notificationsPage.all') : '...', icon: Inbox },
                { id: 'unread', label: isMounted ? t('actions.notificationsPage.unread') : '...', icon: Bell },
                { id: 'archived', label: isMounted ? t('actions.notificationsPage.archived') : '...', icon: Archive }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as NotificationStatusFilter)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    statusFilter === filter.id
                      ? "bg-white dark:bg-[#00D4B3] text-[#0A2540] shadow-sm"
                      : "text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white"
                  )}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#0A2540]/50 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === 'list' ? "bg-white dark:bg-white/10 text-[#0A2540] dark:text-[#00D4B3] shadow-sm" : "text-[#6C757D] dark:text-gray-500"
                )}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewMode === 'grid' ? "bg-white dark:bg-white/10 text-[#0A2540] dark:text-[#00D4B3] shadow-sm" : "text-[#6C757D] dark:text-gray-500"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => mutate()}
              className="p-2.5 bg-gray-100 dark:bg-[#0A2540]/50 text-[#6C757D] dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              title={isMounted ? t('actions.refresh') : ''}
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Notifications Content */}
        <div className={cn(
          "relative",
          viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"
        )}>
          <AnimatePresence mode="popLayout">
            {isLoading && notifications.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin mb-4" />
                <p className="text-[#6C757D] dark:text-gray-400 font-medium">{isMounted ? t('actions.notificationsPage.loading') : '...'}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full py-20 bg-white dark:bg-[#1E2329] rounded-3xl border border-[#E9ECEF] dark:border-white/5 flex flex-col items-center justify-center text-center px-4"
              >
                <div className="w-20 h-20 bg-gray-50 dark:bg-[#0A2540]/30 rounded-[2.5rem] flex items-center justify-center mb-6 rotate-3">
                  <Bell className="w-10 h-10 text-[#6C757D] dark:text-gray-600" />
                </div>
                <h3 className="text-xl font-black text-[#0A2540] dark:text-white uppercase italic mb-2">
                  {isMounted ? t('actions.notificationsPage.emptyTitle') : '...'}
                </h3>
                <p className="text-[#6C757D] dark:text-gray-400 max-w-sm font-medium">
                  {isMounted ? (
                    searchQuery 
                      ? t('actions.notificationsPage.emptySearch', { query: searchQuery })
                      : statusFilter === 'unread' 
                        ? t('actions.notificationsPage.emptyUnread')
                        : t('actions.notificationsPage.emptyDefault')
                  ) : '...'}
                </p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-6 text-[#00D4B3] font-bold hover:underline"
                  >
                    {isMounted ? t('actions.notificationsPage.clearSearch') : '...'}
                  </button>
                )}
              </motion.div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.notification_type)
                const bgColor = getNotificationBgColor(notification.notification_type)
                const textColor = getNotificationTextColor(notification.notification_type)
                const borderColor = getNotificationBorderColor(notification.notification_type)
                const isUnread = notification.status === 'unread'
                
                return (
                  <motion.div
                    key={notification.notification_id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={cn(
                      "group relative transition-all duration-500 rounded-2xl border",
                      "bg-white/80 dark:bg-white/[0.03] backdrop-blur-md",
                      isUnread 
                        ? "border-[#0A2540]/20 dark:border-[#00D4B3]/40 shadow-xl shadow-[#0A2540]/5 dark:shadow-[#00D4B3]/5 ring-1 ring-[#0A2540]/5 dark:ring-[#00D4B3]/20" 
                        : "border-gray-200 dark:border-white/5 hover:border-[#00D4B3]/30",
                      "hover:shadow-2xl hover:shadow-[#00D4B3]/10 hover:-translate-y-1",
                      viewMode === 'grid' ? "flex flex-col p-6 h-full" : "flex items-center gap-5 p-5"
                    )}
                  >
                    {/* Status Indicator */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#0A2540] to-[#00D4B3] rounded-l-2xl" />
                    )}

                    {/* Icon Container */}
                    <div className={cn(
                      "flex-shrink-0 p-3 rounded-xl",
                      bgColor,
                      viewMode === 'grid' ? "w-12 h-12 mb-4" : "w-14 h-14"
                    )}>
                      <Icon className={cn("w-full h-full", textColor.replace('text-', ''))} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0" onClick={() => handleNotificationClick(notification)}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={cn(
                          "font-bold text-sm sm:text-base leading-tight truncate cursor-pointer hover:text-[#00D4B3] transition-colors",
                          isUnread ? "text-[#0A2540] dark:text-white" : "text-[#6C757D] dark:text-gray-300"
                        )}>
                          {isMounted 
                            ? (notification.metadata?.is_localized ? t(notification.title) : notification.title)
                            : '...'}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-bold text-[#6C757D] dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {isMounted ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: currentLocale }) : '...'}
                          </span>
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-xs sm:text-sm leading-relaxed mb-3",
                        isUnread ? "text-[#6C757D] dark:text-gray-300" : "text-[#6C757D] dark:text-gray-500",
                        viewMode === 'list' ? "line-clamp-1" : "line-clamp-3"
                      )}>
                        {isMounted ? (
                          notification.metadata?.is_localized 
                            ? t(notification.message, notification.metadata as any) 
                            : notification.message
                        ) : '...'}
                      </p>

                      <div className="flex items-center gap-4">
                        {notification.priority === 'critical' && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {isMounted ? t('actions.notificationsPage.priority.critical') : '...'}
                          </span>
                        )}
                        {notification.priority === 'high' && (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-md">
                            {isMounted ? t('actions.notificationsPage.priority.high') : '...'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={cn(
                      "flex items-center gap-1",
                      viewMode === 'grid' ? "mt-auto pt-4 border-t border-[#E9ECEF] dark:border-white/5 justify-end" : "ml-4"
                    )}>
                      {isUnread && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction(() => markAsRead(notification.notification_id)) }}
                          className="p-2 text-[#6C757D] dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-all"
                          title={isMounted ? t('actions.markAsRead') : ''}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(() => archiveNotification(notification.notification_id)) }}
                        className="p-2 text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-[#00D4B3] hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                        title={isMounted ? t('actions.archive') : ''}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(() => deleteNotification(notification.notification_id)) }}
                        className="p-2 text-[#6C757D] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        title={isMounted ? t('actions.delete') : ''}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      {notification.metadata?.action_url && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(notification.metadata.action_url) }}
                          className="p-2 text-[#0A2540] dark:text-[#00D4B3] hover:bg-[#00D4B3]/10 rounded-lg transition-all"
                          title={isMounted ? t('actions.viewDetails') : ''}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
