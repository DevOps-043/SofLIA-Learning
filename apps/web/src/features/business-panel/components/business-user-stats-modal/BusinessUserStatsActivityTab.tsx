'use client'

import { motion } from 'framer-motion'
import { Activity, Award, BookOpen, Calendar, Clock, FileText, Target } from 'lucide-react'
import {
  buildBusinessUserStatsCompletionBars,
} from '../../services/business-user-stats-display.service'
import type { BusinessUserStatsTabProps } from './types'

export function BusinessUserStatsActivityTab({
  stats,
  t,
  theme,
  formatMonth,
}: BusinessUserStatsTabProps) {
  const mutedText = theme.mutedTextColor;

  const completionBars = buildBusinessUserStatsCompletionBars(stats.completed_by_month ?? [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      {/* 1. Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActivitySummaryCard
          icon={FileText}
          value={stats.notes_count}
          label={t('users.stats.activity.notesCreated', 'Notas Creadas')}
          color={theme.chartColors[0]}
          theme={theme}
        />
        <ActivitySummaryCard
          icon={Target}
          value={`${stats.completed_assignments || 0}/${stats.total_assignments || 0}`}
          label={t('users.stats.activity.assignments', 'Tareas Finalizadas')}
          color={theme.chartColors[1]}
          theme={theme}
        />
        <ActivitySummaryCard
          icon={Award}
          value={stats.certificates_count}
          label={t('users.stats.activity.certificates', 'Certificaciones')}
          color={theme.chartColors[2]}
          theme={theme}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* 2. Completion History Chart */}
         {completionBars.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3" style={{ color: mutedText }}>
                  <Calendar className="w-4 h-4" style={{ color: theme.primaryColor }} />
                  {t('users.stats.activity.completionHistory', 'Historial de Avance')}
               </h3>
               
               <div className="space-y-5">
                  {completionBars.map((item, index) => (
                     <div key={item.month} className="flex items-center gap-6 group">
                        <div className="w-24 text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                           {formatMonth(item.month)}
                        </div>
                        <div className="flex-1 relative h-10 rounded-2xl border overflow-hidden" style={{ backgroundColor: theme.cardBg, borderColor: theme.modalBorder }}>
                           <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 1.2, delay: 0.3 + index * 0.1 }}
                              className="absolute inset-y-0 left-0 rounded-2xl flex items-center justify-end px-4"
                              style={{
                                 background: `linear-gradient(90deg, ${theme.primaryColor}20, ${theme.primaryColor}80)`,
                                 minWidth: '60px',
                              }}
                           >
                              <span className="text-[10px] font-black uppercase tracking-widest shadow-xl" style={{ color: theme.onPrimaryColor }}>
                                 {item.count} {t('users.stats.activity.courses', 'CURSOS')}
                              </span>
                           </motion.div>
                        </div>
                     </div>
                  ))}
               </div>
            </motion.div>
         )}

         {/* 3. Engagement Snapshot */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3" style={{ color: mutedText }}>
               <Activity className="w-4 h-4" style={{ color: theme.primaryColor }} />
               {t('users.stats.activity.summary', 'Resumen de Engagement')}
            </h3>

            <div className="grid grid-cols-1 gap-6">
               <EngagementCard
                  icon={Clock}
                  value={`${stats.total_time_spent_hours}h`}
                  label={t('users.stats.activity.studyTime', 'Tiempo de Estudio')}
                  desc="Invertido en lecciones interactivas"
                  theme={theme}
               />
               <EngagementCard
                  icon={BookOpen}
                  value={`${stats.completed_lessons || 0}/${stats.total_lessons || 0}`}
                  label={t('users.stats.activity.lessons', 'Lecciones Vistas')}
                  desc="Progreso granular del temario"
                  theme={theme}
               />
            </div>
         </motion.div>
      </div>
    </motion.div>
  )
}

function ActivitySummaryCard({ icon: Icon, value, label, color, theme }: any) {
   return (
      <div className="relative p-8 rounded-[2.5rem] border shadow-2xl overflow-hidden group transition-all hover:scale-[1.02]" 
           style={{ backgroundColor: theme.cardBg, borderColor: theme.modalBorder }}>
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-bl-full border-l border-b border-white/[0.05]" />
         <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl transform group-hover:rotate-12 transition-transform duration-500" 
              style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-6 h-6" style={{ color }} />
         </div>
         <div className="text-4xl font-black tracking-tight mb-1" style={{ color: theme.textColor }}>{value}</div>
         <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{label}</div>
      </div>
   )
}

function EngagementCard({ icon: Icon, value, label, desc, theme }: any) {
   return (
      <div className="flex items-center gap-6 p-6 rounded-[2.5rem] border shadow-lg" 
           style={{ backgroundColor: theme.cardBg, borderColor: theme.modalBorder }}>
         <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5">
            <Icon className="w-7 h-7" style={{ color: theme.primaryColor }} strokeWidth={2.5} />
         </div>
         <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</div>
            <div className="text-2xl font-black tracking-tighter" style={{ color: theme.textColor }}>{value}</div>
            <div className="text-[9px] font-medium opacity-30 uppercase tracking-widest mt-0.5">{desc}</div>
         </div>
      </div>
   )
}
