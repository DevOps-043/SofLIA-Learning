'use client'

import { motion } from 'framer-motion'
import { BookOpen, Clock, Sparkles, User, Users, Calendar } from 'lucide-react'
import type { BusinessUser } from '../../services/businessUsers.service'
import { getBusinessAssignCourseDisplayName } from './service'
import type { BusinessAssignCourseCopyProps, BusinessAssignCourseTheme } from './types'

interface BusinessAssignCoursePreviewPanelProps extends BusinessAssignCourseCopyProps {
  courseTitle: string
  dueDate: string
  selectedUsers: BusinessUser[]
  selectedUserCount: number
  availableUserCount: number
  theme: BusinessAssignCourseTheme
}

export function BusinessAssignCoursePreviewPanel({
  courseTitle,
  dueDate,
  selectedUsers,
  selectedUserCount,
  availableUserCount,
  theme,
  t,
}: BusinessAssignCoursePreviewPanelProps) {
  const progressPercent = availableUserCount > 0
    ? (selectedUserCount / availableUserCount) * 100
    : 0

  return (
    <div
      className="w-80 flex-shrink-0 flex-col p-10 border-r hidden xl:flex relative overflow-hidden"
      style={{
        backgroundColor: theme.isDark ? '#1E2329' : '#F8FAFC',
        borderColor: theme.borderColor,
      }}
    >
      {/* Background Subtle Accent */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 blur-[100px] opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.primaryColor }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-10"
      >
        <div
          className="w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto !text-white relative z-10"
          style={{
            backgroundColor: theme.primaryColor,
            boxShadow: `0 20px 40px ${theme.primaryColor}30`,
          }}
        >
          <BookOpen className="w-10 h-10 !text-white" />
          
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl z-20"
            style={{ backgroundColor: theme.accentColor }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
        </div>
      </motion.div>

      <div className="text-center mb-10">
        <h3 className="text-xl font-black uppercase tracking-widest mb-3" style={{ color: theme.textColor }}>
          {t('assignCourse.title')}
        </h3>
        <p className="text-sm font-medium leading-relaxed" style={{ color: `${theme.textColor}60` }}>
          {courseTitle}
        </p>
      </div>

      <div className="space-y-6">
        {/* Selection Stats Card */}
        <div
          className="p-6 rounded-[2rem] border border-white/5 shadow-inner"
          style={{ backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <Users className="w-4 h-4" style={{ color: theme.primaryColor }} />
               <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${theme.textColor}50` }}>
                 {t('assignCourse.stats.selected')}
               </span>
            </div>
            <span className="text-2xl font-black" style={{ color: theme.primaryColor }}>
              {selectedUserCount}
            </span>
          </div>

          <div
            className="h-2 rounded-full overflow-hidden mb-3"
            style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: theme.primaryColor }}
            />
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>
             <span>0</span>
             <span>{availableUserCount} disponibles</span>
          </div>
        </div>

        {/* Selected Avatars Summary */}
        {selectedUserCount > 0 && (
          <div className="pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-50" style={{ color: theme.textColor }}>
              {t('assignCourse.stats.usersSelected')}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.slice(0, 7).map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black !text-white border-2 border-[#1E2329]"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {getBusinessAssignCourseDisplayName(user)[0].toUpperCase()}
                </motion.div>
              ))}
              {selectedUserCount > 7 && (
                <div
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-[10px] font-black border border-white/10"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: theme.textColor,
                  }}
                >
                  +{selectedUserCount - 7}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-8 border-t border-white/5">
        {dueDate ? (
          <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-accent-color/10 border border-accent-color/20" style={{ backgroundColor: `${theme.accentColor}10`, borderColor: `${theme.accentColor}20` }}>
            <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: theme.accentColor }} />
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.accentColor }}>Fecha Límite</span>
               <span className="text-sm font-bold" style={{ color: theme.textColor }}>{new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 opacity-40">
            <Clock className="w-5 h-5" style={{ color: theme.textColor }} />
            <span className="text-xs font-bold uppercase tracking-widest">{t('assignCourse.labels.noDueDate', 'Sin fecha límite')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
