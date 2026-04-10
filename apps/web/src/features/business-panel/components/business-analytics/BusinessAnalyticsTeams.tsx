'use client'

import { motion } from 'framer-motion'
import { BarChart3, Trophy, Users, UsersRound, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { BusinessPanelStatCard } from '../shared/BusinessPanelStatCard'
import {
  getBusinessAnalyticsCompletionWidth,
  getBusinessAnalyticsRelativeBarWidth,
  getBusinessAnalyticsTeamSummary,
} from '../../services/business-analytics-display.service'
import type { BusinessAnalyticsTeamItem, BusinessAnalyticsTeamsProps } from './types'

const PODIUM_COLORS = ['#FBBF24', '#94A3B8', '#CD7F32']

export function BusinessAnalyticsTeams({ teams }: BusinessAnalyticsTeamsProps) {
  const { t } = useTranslation('business')
  const panelTheme = useBusinessPanelTheme()
  const summary = getBusinessAnalyticsTeamSummary(teams?.teams, teams?.ranking)
  const maxProgress = Math.max(
    ...(teams?.ranking?.map((team) => team.stats.average_progress) || [0]),
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <BusinessPanelStatCard
          icon={<UsersRound className="w-5 h-5" />}
          title={t('analytics.teams.totalTeams', 'Total Equipos')}
          value={teams?.total_teams || 0}
          iconColor={panelTheme.actionColor}
        />
        <BusinessPanelStatCard
          icon={<Trophy className="w-5 h-5" />}
          title={t('analytics.teams.bestProgress', 'Mejor Progreso')}
          value={`${summary.bestTeamProgress}%`}
          iconColor={panelTheme.warningColor}
        />
        <BusinessPanelStatCard
          icon={<Users className="w-5 h-5" />}
          title={t('analytics.teams.totalMembers', 'Total Miembros')}
          value={summary.totalMembers}
          iconColor={panelTheme.brandColor}
        />
        <BusinessPanelStatCard
          icon={<Zap className="w-5 h-5" />}
          title={t('analytics.teams.totalChats', 'Total SofLIA Chats')}
          value={summary.totalLiaChats}
          iconColor={panelTheme.successColor}
        />
      </div>

      <div
        className="p-6 rounded-3xl border"
        style={{
          backgroundColor: panelTheme.cardBg,
          borderColor: panelTheme.borderColor,
        }}
      >
        <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: panelTheme.textColor }}>
          <BarChart3 className="w-5 h-5" style={{ color: panelTheme.actionColor }} />
          {t('analytics.teams.progressComparison')}
        </h3>

        {teams?.ranking?.length > 0 ? (
          <div className="space-y-4">
            {teams.ranking.map((team, index) => (
              <TeamRankingRow
                key={team.team_id}
                team={team}
                index={index}
                maxProgress={maxProgress}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12" style={{ color: panelTheme.subtextColor }}>
            <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('analytics.teams.noTeams')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {teams?.teams?.map((team) => (
          <TeamCard key={team.team_id} team={team} />
        ))}
      </div>
    </motion.div>
  )
}

function TeamRankingRow({
  team,
  index,
  maxProgress,
}: {
  team: BusinessAnalyticsTeamItem
  index: number
  maxProgress: number
}) {
  const { t } = useTranslation('business')
  const panelTheme = useBusinessPanelTheme()
  const barWidth = getBusinessAnalyticsRelativeBarWidth(
    team.stats.average_progress,
    maxProgress,
  )
  const rankTone = PODIUM_COLORS[index] ?? panelTheme.hoverBg

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          backgroundColor: rankTone,
          color: index < PODIUM_COLORS.length ? '#000000' : panelTheme.textColor,
        }}
      >
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1 gap-4">
          <span className="font-medium text-sm" style={{ color: panelTheme.textColor }}>
            {team.name}
          </span>
          <span className="text-sm" style={{ color: panelTheme.subtextColor }}>
            {team.member_count} {t('analytics.teams.members')}
          </span>
        </div>
        <div
          className="relative h-6 rounded-full overflow-hidden"
          style={{ backgroundColor: panelTheme.hoverBg }}
        >
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            style={{
              background: `linear-gradient(90deg, ${panelTheme.actionColor}, ${panelTheme.brandColor})`,
            }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
            style={{ color: panelTheme.textColor }}
          >
            {team.stats.average_progress}%
          </span>
        </div>
      </div>
    </div>
  )
}

function TeamCard({ team }: { team: BusinessAnalyticsTeamItem }) {
  const { t } = useTranslation('business')
  const panelTheme = useBusinessPanelTheme()

  return (
    <div
      className="p-5 rounded-3xl border"
      style={{
        backgroundColor: panelTheme.cardBg,
        borderColor: panelTheme.borderColor,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${panelTheme.actionColor}, ${panelTheme.brandColor})`,
          }}
        >
          {team.image_url ? (
            <img src={team.image_url} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <UsersRound className="w-7 h-7" style={{ color: panelTheme.onPrimaryColor }} />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-lg" style={{ color: panelTheme.textColor }}>
            {team.name}
          </h4>
          <p className="text-sm line-clamp-1" style={{ color: panelTheme.subtextColor }}>
            {team.description || t('analytics.teams.noDescription')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <MetricTile
          label={t('analytics.teams.members', 'Miembros')}
          value={team.member_count}
          color={panelTheme.actionColor}
        />
        <MetricTile
          label={t('analytics.teams.progress', 'Progreso')}
          value={`${team.stats?.average_progress || 0}%`}
          color={panelTheme.successColor}
        />
        <MetricTile
          label={t('analytics.teams.time', 'Tiempo')}
          value={`${team.stats?.total_time_hours || 0}h`}
          color={panelTheme.brandColor}
        />
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${panelTheme.dividerColor}` }}>
        <div className="flex justify-between text-sm">
          <span style={{ color: panelTheme.subtextColor }}>
            {t('analytics.teams.coursesCompleted')}
          </span>
          <span className="font-medium" style={{ color: panelTheme.textColor }}>
            {team.stats?.courses_completed || 0} / {team.stats?.total_enrollments || 0}
          </span>
        </div>
        <div
          className="h-2 rounded-full mt-2 overflow-hidden"
          style={{ backgroundColor: panelTheme.hoverBg }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${getBusinessAnalyticsCompletionWidth(
                team.stats?.courses_completed || 0,
                team.stats?.total_enrollments || 0,
              )}%`,
              background: `linear-gradient(90deg, ${panelTheme.successColor}, ${panelTheme.actionColor})`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

function MetricTile({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div
      className="text-center p-3 rounded-2xl border"
      style={{
        backgroundColor: panelTheme.hoverBg,
        borderColor: panelTheme.borderColor,
      }}
    >
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: panelTheme.subtextColor }}>
        {label}
      </p>
    </div>
  )
}
