'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BarChart3, Target, UserCheck, Users, UsersRound, XCircle } from 'lucide-react'
import Image from 'next/image'
import { EngagementAnalytics } from './EngagementAnalytics'
import {
  BusinessAnalyticsOverview,
  BusinessAnalyticsTeams,
  BusinessAnalyticsUserDetailModal,
  BusinessAnalyticsUsersTable,
  TabButton,
} from './business-analytics'
import { useBusinessAnalyticsLogic } from '../hooks/useBusinessAnalyticsLogic'

export function BusinessAnalytics() {
  const {
    t,
    data,
    isLoading,
    error,
    refetch,
    activeTab,
    setActiveTab,
    selectedUser,
    setSelectedUser,
    cardBg,
    cardBorder,
    textColor,
    accentColor,
    secondaryColor,
  } = useBusinessAnalyticsLogic()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
          />
          <p className="opacity-70" style={{ color: textColor }}>
            {t('analytics.loading')}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <p className="text-lg mb-4 text-red-400">{error}</p>
        <button
          onClick={refetch}
          className="px-6 py-2 rounded-xl transition-all"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {t('analytics.retry')}
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="opacity-70" style={{ color: textColor }}>
          {t('analytics.noData')}
        </p>
      </div>
    )
  }

  return (
    <div
      className="w-full space-y-8 text-gray-900 dark:text-slate-50"
      style={{ ...(textColor ? { color: textColor } : {}) }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 shadow-xl"
        style={{
          backgroundColor: '#0A2540',
          color: '#FFFFFF',
        }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/teams-header.png"
            alt="Analytics Header"
            fill
            className="object-cover"
            style={{ opacity: 0.5 }}
            priority
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/90 via-[#0A2540]/50 to-transparent z-0 pointer-events-none" />

        <div
          className="absolute inset-0 opacity-10 z-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <BarChart3 className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </div>
            <span
              className="text-sm font-bold tracking-widest uppercase drop-shadow-sm"
              style={{ color: 'rgba(219, 234, 254, 0.9)' }}
            >
              {t('analytics.center')}
            </span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-3 tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            {t('analytics.headerTitle')}
          </h1>

          <p
            className="text-base max-w-2xl leading-relaxed drop-shadow-sm"
            style={{ color: '#EFF6FF' }}
          >
            {t('analytics.headerSubtitle')}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton
          isActive={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          label={t('analytics.tabs.overview')}
          icon={Target}
        />
        <TabButton
          isActive={activeTab === 'users'}
          onClick={() => setActiveTab('users')}
          label={t('analytics.tabs.users')}
          icon={UserCheck}
        />
        <TabButton
          isActive={activeTab === 'engagement'}
          onClick={() => setActiveTab('engagement')}
          label={t('analytics.tabs.engagement')}
          icon={Users}
        />
        <TabButton
          isActive={activeTab === 'teams'}
          onClick={() => setActiveTab('teams')}
          label={t('analytics.tabs.teams')}
          icon={UsersRound}
        />
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <BusinessAnalyticsOverview data={data} accentColor={accentColor} />
        )}

        {activeTab === 'users' && (
          <BusinessAnalyticsUsersTable
            users={data.user_analytics}
            onSelectUser={setSelectedUser}
          />
        )}

        {activeTab === 'engagement' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <EngagementAnalytics data={data} />
          </motion.div>
        )}

        {activeTab === 'teams' && (
          <BusinessAnalyticsTeams
            teams={data.teams}
            accentColor={accentColor}
            secondaryColor={secondaryColor}
          />
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <BusinessAnalyticsUserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            theme={{ cardBg, cardBorder, accentColor, textColor, secondaryColor }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
