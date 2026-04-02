'use client'

import { motion } from 'framer-motion'
import { BarChart3, Trophy, Users, UsersRound, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getBusinessAnalyticsCompletionWidth,
  getBusinessAnalyticsRelativeBarWidth,
  getBusinessAnalyticsTeamSummary,
} from '../../services/business-analytics-display.service'
import type { BusinessAnalyticsTeamItem, BusinessAnalyticsTeamsProps } from './types'

export function BusinessAnalyticsTeams({
  teams,
  accentColor,
  secondaryColor,
}: BusinessAnalyticsTeamsProps) {
  const { t } = useTranslation('business')
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
      <div className="grid grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
              <UsersRound className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Equipos</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {teams?.total_teams || 0}
          </p>
        </div>
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Mejor Progreso</span>
          </div>
          <p className="text-3xl font-bold text-emerald-500">
            {summary.bestTeamProgress}%
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {summary.bestTeamName}
          </p>
        </div>
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Miembros</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalMembers}
          </p>
        </div>
        <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total SofLIA Chats</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {summary.totalLiaChats}
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: accentColor }} />
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
                accentColor={accentColor}
                secondaryColor={secondaryColor}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 opacity-50">
            <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('analytics.teams.noTeams')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {teams?.teams?.map((team) => (
          <TeamCard key={team.team_id} team={team} accentColor={accentColor} />
        ))}
      </div>
    </motion.div>
  )
}

function TeamRankingRow({
  team,
  index,
  maxProgress,
  accentColor,
  secondaryColor,
}: {
  team: BusinessAnalyticsTeamItem
  index: number
  maxProgress: number
  accentColor: string
  secondaryColor: string
}) {
  const { t } = useTranslation('business')
  const barWidth = getBusinessAnalyticsRelativeBarWidth(
    team.stats.average_progress,
    maxProgress,
  )

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{
          backgroundColor:
            index === 0
              ? '#fbbf24'
              : index === 1
                ? '#94a3b8'
                : index === 2
                  ? '#cd7f32'
                  : 'rgba(255,255,255,0.1)',
          color: index < 3 ? '#000' : '#fff',
        }}
      >
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-sm text-gray-900 dark:text-white">{team.name}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {team.member_count} {t('analytics.teams.members')}
          </span>
        </div>
        <div className="relative h-6 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            style={{
              background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})`,
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-900 dark:text-white">
            {team.stats.average_progress}%
          </span>
        </div>
      </div>
    </div>
  )
}

function TeamCard({
  team,
  accentColor,
}: {
  team: BusinessAnalyticsTeamItem
  accentColor: string
}) {
  const { t } = useTranslation('business')

  return (
    <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          {team.image_url ? (
            <img src={team.image_url} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <UsersRound className="w-7 h-7 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{team.name}</h4>
          <p className="text-sm opacity-50 line-clamp-1">
            {team.description || t('analytics.teams.noDescription')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-white/5">
          <p className="text-xl font-bold" style={{ color: accentColor }}>
            {team.member_count}
          </p>
          <p className="text-xs opacity-50">Miembros</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-white/5">
          <p className="text-xl font-bold text-emerald-400">
            {team.stats?.average_progress || 0}%
          </p>
          <p className="text-xs opacity-50">Progreso</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-white/5">
          <p className="text-xl font-bold text-blue-400">
            {team.stats?.total_time_hours || 0}h
          </p>
          <p className="text-xs opacity-50">Tiempo</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {t('analytics.teams.coursesCompleted')}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {team.stats?.courses_completed || 0} / {team.stats?.total_enrollments || 0}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            style={{
              width: `${getBusinessAnalyticsCompletionWidth(
                team.stats?.courses_completed || 0,
                team.stats?.total_enrollments || 0,
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
