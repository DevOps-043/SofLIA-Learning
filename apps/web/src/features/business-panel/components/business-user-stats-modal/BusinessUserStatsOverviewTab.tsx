'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  HelpCircle,
  MessageSquare,
  PlayCircle,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  shouldShowBusinessUserPlatformActivity,
} from '../../services/business-user-stats-display.service'
import { BusinessUserStatsMetricCard } from './shared'
import type { BusinessUserStatsTabProps } from './types'

export function BusinessUserStatsOverviewTab({
  stats,
  t,
  theme,
}: Pick<BusinessUserStatsTabProps, 'stats' | 't' | 'theme'>) {
  const isDark = theme.isDark;
  const mutedText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)';
  const inputBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="space-y-12">
      {/* 1. Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            icon: BookOpen,
            label: t('users.stats.cards.courses', 'Cursos'),
            value: stats.total_courses,
            iconColor: theme.primaryColor,
          },
          {
            icon: CheckCircle,
            label: t('users.stats.cards.completed', 'Completados'),
            value: stats.completed_courses,
            iconColor: theme.accentColor,
          },
          {
            icon: Clock,
            label: t('users.stats.cards.hours', 'Horas'),
            value: stats.total_time_spent_hours,
            iconColor: theme.secondaryColor || theme.primaryColor,
          },
          {
            icon: Award,
            label: t('users.stats.cards.certificates', 'Certificados'),
            value: stats.certificates_count,
            iconColor: theme.primaryColor,
          },
        ].map((item, index) => (
          <BusinessUserStatsMetricCard key={item.label} {...item} delay={index * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
         {/* 2. Platform Activity */}
         {shouldShowBusinessUserPlatformActivity(stats) && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3" style={{ color: mutedText }}>
                  <Activity className="w-4 h-4" style={{ color: theme.primaryColor }} />
                  {t('users.stats.platformActivity.title', 'Actividad en Plataforma')}
               </h3>
               <div className="space-y-4">
                  {stats.lia_conversations_total !== undefined && (
                     <ActivityItem
                        icon={MessageSquare}
                        value={stats.lia_conversations_total}
                        label={t('users.stats.platformActivity.liaQueries', 'Consultas LIA')}
                        helper={`${stats.lia_messages_total || 0} ${t('users.stats.platformActivity.messages', 'mensajes')}`}
                        color={theme.primaryColor}
                        theme={theme}
                     />
                  )}
                  {stats.quiz_total !== undefined && stats.quiz_total > 0 && (
                     <ActivityItem
                        icon={HelpCircle}
                        value={`${stats.quiz_passed || 0}/${stats.quiz_total}`}
                        label={t('users.stats.platformActivity.quizzesPassed', 'Evaluaciones')}
                        helper={`${stats.quiz_average_score || 0}% ${t('users.stats.platformActivity.average', 'promedio')}`}
                        color={theme.accentColor}
                        theme={theme}
                     />
                  )}
                  {stats.lia_activities_completed !== undefined && (
                     <ActivityItem
                        icon={Zap}
                        value={stats.lia_activities_completed}
                        label={t('users.stats.platformActivity.liaActivities', 'Actividades LIA')}
                        helper={`${stats.lia_activities_total || 0} ${t('users.stats.platformActivity.total', 'en total')}`}
                        color={isDark ? '#F43F5E' : '#E11D48'}
                        theme={theme}
                     />
                  )}
               </div>
            </motion.div>
         )}

         {/* 3. General Progress & Breakdown */}
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3" style={{ color: mutedText }}>
               <PlayCircle className="w-4 h-4" style={{ color: theme.primaryColor }} />
               {t('users.stats.generalProgress.title', 'Progreso General')}
            </h3>
            
            <div className="rounded-[2.5rem] p-8 border shadow-2xl relative overflow-hidden" 
               style={{ backgroundColor: inputBg, borderColor }}>
               
               <div className="flex items-center justify-between mb-8">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('users.stats.generalProgress.subtitle', 'Avance Acumulado')}</div>
                  <div className="text-4xl font-black tracking-tighter" style={{ color: theme.primaryColor }}>{stats.average_progress}%</div>
               </div>

               {/* Progress Bar - ULTRA PREMIUM */}
               <div className="relative h-4 rounded-full bg-white/5 border border-white/5 overflow-hidden mb-10">
                  <motion.div
                     initial={{ width: 0 }}
                     animate={{ width: `${stats.average_progress}%` }}
                     transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                     className="absolute inset-y-0 left-0 rounded-full"
                     style={{
                        background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor})`,
                        boxShadow: `0 0 30px ${theme.primaryColor}80`,
                     }}
                  />
               </div>

               <div className="grid grid-cols-3 gap-4">
                  <ProgressSmallCard icon={CheckCircle} value={stats.completed_courses} label="Completados" color={theme.accentColor} theme={theme} />
                  <ProgressSmallCard icon={PlayCircle} value={stats.in_progress_courses} label="En Progreso" color={theme.primaryColor} theme={theme} />
                  <ProgressSmallCard icon={XCircle} value={stats.not_started_courses} label="Sin Iniciar" color={mutedText} theme={theme} />
               </div>
            </div>
         </motion.div>
      </div>
    </div>
  )
}

function ActivityItem({ icon: Icon, value, label, helper, color, theme }: any) {
   const isDark = theme.isDark;
   return (
      <div className="flex items-center gap-4 p-5 rounded-[1.8rem] border shadow-lg transition-all hover:scale-[1.01]" 
           style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
         <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-6 h-6" style={{ color }} />
         </div>
         <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-0.5">{label}</div>
            <div className="text-lg font-black tracking-tight" style={{ color: theme.textColor }}>{value}</div>
         </div>
         {helper && (
            <div className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border"
                 style={{ backgroundColor: `${color}10`, borderColor: `${color}20`, color }}>
               {helper}
            </div>
         )}
      </div>
   )
}

function ProgressSmallCard({ icon: Icon, value, label, color, theme }: any) {
   return (
      <div className="text-center p-4 rounded-[1.8rem] border" 
           style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
         <Icon className="w-5 h-5 mx-auto mb-2 opacity-30" style={{ color }} strokeWidth={2.5} />
         <div className="text-xl font-black mb-0.5" style={{ color: theme.textColor }}>{value}</div>
         <div className="text-[8px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>{label}</div>
      </div>
   )
}
