import { motion } from 'framer-motion'
import { BookOpen, Clock, Sparkles, User } from 'lucide-react'
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
  return (
    <div
      className="w-80 flex-shrink-0 flex-col p-8 border-r hidden xl:flex"
      style={{
        backgroundColor: theme.isDark ? `${theme.primaryColor}15` : '#F8FAFC',
        borderColor: theme.borderColor,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-6"
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto !text-white"
          style={{
            backgroundColor: theme.primaryColor,
            color: '#FFFFFF',
            boxShadow: `0 8px 30px ${theme.primaryColor}40`,
          }}
        >
          <BookOpen className="w-10 h-10 !text-white" color="#FFFFFF" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: theme.accentColor }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
      </motion.div>

      <div className="text-center mb-6">
        <h3 className="font-bold text-lg mb-2" style={{ color: theme.textColor }}>
          {t('assignCourse.title')}
        </h3>
        <p className="text-sm line-clamp-2" style={{ color: `${theme.textColor}70` }}>
          {courseTitle}
        </p>
      </div>

      <div
        className="p-3 rounded-xl border border-white/10 mb-6 text-center"
        style={{ backgroundColor: `${theme.cardBackground}80` }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <User className="w-4 h-4" style={{ color: theme.primaryColor }} />
          <span className="text-sm font-medium" style={{ color: theme.textColor }}>
            {t('assignCourse.modes.individual')}
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div
          className="p-4 rounded-xl border border-white/10"
          style={{ backgroundColor: `${theme.cardBackground}80` }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: `${theme.textColor}70` }}>
              {t('assignCourse.stats.selected')}
            </span>
            <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
              {selectedUserCount}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${theme.primaryColor}20` }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width:
                  availableUserCount > 0
                    ? `${(selectedUserCount / availableUserCount) * 100}%`
                    : '0%',
              }}
              className="h-full rounded-full"
              style={{ backgroundColor: theme.primaryColor }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: `${theme.textColor}50` }}>
            {t('assignCourse.stats.of')} {availableUserCount} {t('assignCourse.stats.available')}
          </p>
        </div>
      </div>

      {selectedUserCount > 0 && (
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-medium mb-3" style={{ color: `${theme.textColor}60` }}>
            {t('assignCourse.stats.usersSelected')}
          </p>
          <div
            className="flex flex-wrap gap-2 max-h-32 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {selectedUsers.slice(0, 8).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold !text-white border-2 border-white/20"
                style={{ backgroundColor: theme.primaryColor, color: '#FFFFFF' }}
                title={getBusinessAssignCourseDisplayName(user)}
              >
                {getBusinessAssignCourseDisplayName(user)[0].toUpperCase()}
              </motion.div>
            ))}
            {selectedUserCount > 8 && (
              <div
                className="px-2 py-1 rounded-lg text-xs font-bold border"
                style={{
                  backgroundColor: `${theme.primaryColor}30`,
                  color: theme.primaryColor,
                  borderColor: theme.primaryColor,
                }}
              >
                +{selectedUserCount - 8}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 space-y-3">
        {dueDate && (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: `${theme.textColor}70` }}
          >
            <Clock className="w-4 h-4" style={{ color: theme.accentColor }} />
            <span>
              {t('assignCourse.labels.dueDate')}:{' '}
              {new Date(dueDate).toLocaleDateString('es-ES')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
