'use client'

import { Award, BookOpen, Building, Calendar, Clock, GraduationCap, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import type { UserDetail } from '../types'
import { formatProgressDate } from './user-progress.formatters'
import { UserProgressSidebarStat } from './UserProgressSidebarStat'

interface UserProgressSidebarProps {
  user: UserDetail
}

export function UserProgressSidebar({ user }: UserProgressSidebarProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <aside className="w-full space-y-4 border-b p-5 md:w-80 md:border-b-0 md:border-r" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <div className="flex flex-col items-center text-center">
        {user.profilePictureUrl ? <img src={user.profilePictureUrl} alt="" className="mb-3 h-20 w-20 rounded-full object-cover" /> : <span className="mb-3 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: theme.heroBackground, color: theme.inverseTextColor }}><UserCheck className="h-8 w-8" /></span>}
        <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>{user.displayName || user.username}</h3>
        <p className="text-sm" style={{ color: theme.subtextColor }}>{user.email}</p>
      </div>

      {user.organization ? <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}><Building className="h-4 w-4" style={{ color: theme.mutedTextColor }} /><div><p className="text-sm font-medium" style={{ color: theme.textColor }}>{user.organization}</p>{user.orgRole ? <p className="text-xs" style={{ color: theme.subtextColor }}>{user.orgRole}</p> : null}</div></div> : null}

      <div className="space-y-3">
        <UserProgressSidebarStat icon={BookOpen} label={t('userStats.progressModal.sidebar.courses')} value={String(user.coursesEnrolled)} />
        <UserProgressSidebarStat icon={GraduationCap} label={t('userStats.progressModal.sidebar.progress')} value={`${user.avgProgress}%`} />
        <UserProgressSidebarStat icon={Clock} label={t('userStats.progressModal.sidebar.hours')} value={`${user.studyHours}h`} />
        <UserProgressSidebarStat icon={Award} label={t('userStats.progressModal.sidebar.certificates')} value={String(user.certificates)} />
        <UserProgressSidebarStat icon={Calendar} label={t('userStats.progressModal.sidebar.lastLogin')} value={formatProgressDate(user.lastLogin, t)} />
      </div>
    </aside>
  )
}
