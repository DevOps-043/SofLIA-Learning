'use client'

import { UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { UserDetail } from '../types'
import { formatUserStatsDate, formatUserStatsGender } from './user-detail.formatters'

interface UserDetailRowProps {
  user: UserDetail
  onSelect: (user: UserDetail) => void
}

export function UserDetailRow({ user, onSelect }: UserDetailRowProps) {
  const { t } = useTranslation(['admin', 'common'])

  return (
    <tr className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/5" onClick={() => onSelect(user)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.profilePictureUrl ? <img src={user.profilePictureUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-white"><UserCheck className="h-4 w-4" /></span>}
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.displayName || user.username}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{user.organization || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{user.orgRole || '—'}</td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatUserStatsGender(user.gender, t)}</td>
      <td className="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">{user.age ?? t('demographics.notSpecified', { ns: 'common' })}</td>
      <td className="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">{user.coursesEnrolled}</td>
      <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-2"><div className="h-2 w-16 rounded-full bg-slate-200 dark:bg-white/10"><div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${Math.min(user.avgProgress, 100)}%` }} /></div><span className="text-xs text-slate-600 dark:text-slate-300">{user.avgProgress}%</span></div></td>
      <td className="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">{user.studyHours}h</td>
      <td className="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">{user.certificates}</td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatUserStatsDate(user.lastLogin, t)}</td>
    </tr>
  )
}
