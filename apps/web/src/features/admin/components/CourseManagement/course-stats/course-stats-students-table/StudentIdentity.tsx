import type { CourseStatsStudentRow } from './types'

interface StudentIdentityProps {
  user: CourseStatsStudentRow
  avatarSize?: 'sm' | 'md'
}

export function StudentIdentity({ user, avatarSize = 'sm' }: StudentIdentityProps) {
  const avatarClassName = avatarSize === 'md' ? 'h-12 w-12' : 'h-10 w-10'

  return (
    <div className="flex items-center gap-3">
      {user.profile_picture ? (
        <img
          alt={user.display_name}
          className={`${avatarClassName} rounded-full border-2 border-accent`}
          src={user.profile_picture}
        />
      ) : (
        <div className={`${avatarClassName} flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white`}>
          {user.display_name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {user.display_name}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-white/60">
          {user.email || user.username}
        </p>
      </div>
    </div>
  )
}
