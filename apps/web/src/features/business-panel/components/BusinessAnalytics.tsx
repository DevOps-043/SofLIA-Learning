'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Sparkles,
  Target,
  UserCheck,
  Users,
  UsersRound,
  XCircle,
} from 'lucide-react'
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
    panelTheme,
  } = useBusinessAnalyticsLogic()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${panelTheme.accentColor}30`,
              borderTopColor: panelTheme.accentColor,
            }}
          />
          <p className="opacity-70" style={{ color: panelTheme.textColor }}>
            {t('analytics.loading')}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-3xl border p-8 text-center"
        style={{
          backgroundColor: panelTheme.cardBg,
          borderColor: panelTheme.borderColor,
          color: panelTheme.textColor,
        }}
      >
        <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: panelTheme.dangerColor }} />
        <p className="text-lg mb-4" style={{ color: panelTheme.dangerColor }}>
          {error}
        </p>
        <button
          onClick={refetch}
          className="px-6 py-2 rounded-xl transition-all font-semibold"
          style={{
            backgroundColor: `${panelTheme.accentColor}20`,
            color: panelTheme.accentColor,
          }}
        >
          {t('analytics.retry')}
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="opacity-70" style={{ color: panelTheme.textColor }}>
          {t('analytics.noData')}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8" style={{ color: panelTheme.textColor }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[32px] border p-8 md:p-10 group"
        style={{ borderColor: panelTheme.heroBorderColor }}
      >
        <div
          className="absolute inset-0 z-0"
          style={{
            background: panelTheme.heroBackground,
          }}
        />

        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.9) 1px, transparent 0)',
              backgroundSize: '30px 30px',
            }}
          />
        </div>

        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-12 right-24 w-3 h-3 rounded-full"
          style={{ backgroundColor: panelTheme.accentColor }}
        />
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 0.8 }}
          className="absolute bottom-10 right-40 w-2 h-2 rounded-full"
          style={{ backgroundColor: panelTheme.accentColor }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="p-3 rounded-2xl border backdrop-blur-md"
              style={{
                backgroundColor: panelTheme.inverseSurface,
                borderColor: panelTheme.inverseBorderColor,
              }}
            >
              <BarChart3 className="w-5 h-5" style={{ color: panelTheme.accentColor }} />
            </div>
            <span
              className="text-sm font-semibold tracking-wider uppercase"
              style={{ color: panelTheme.accentColor }}
            >
              {t('analytics.center')}
            </span>
            <Sparkles className="w-4 h-4" style={{ color: panelTheme.accentColor }} />
          </div>

          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{ color: panelTheme.inverseTextColor }}
          >
            {t('analytics.headerTitle')}
          </h1>

          <p className="text-lg max-w-3xl" style={{ color: panelTheme.inverseSubtextColor }}>
            {t('analytics.headerSubtitle')}
          </p>
        </div>
      </motion.div>

      <div
        className="flex flex-wrap gap-2 p-1 rounded-2xl w-fit"
        style={{
          backgroundColor: panelTheme.cardBg,
          border: `1px solid ${panelTheme.borderColor}`,
        }}
      >
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
        {activeTab === 'overview' && <BusinessAnalyticsOverview data={data} />}

        {activeTab === 'users' && (
          <BusinessAnalyticsUsersTable users={data.user_analytics} onSelectUser={setSelectedUser} />
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

        {activeTab === 'teams' && <BusinessAnalyticsTeams teams={data.teams} />}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <BusinessAnalyticsUserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
