import type { BusinessUserDashboardShellProps } from './types'
import styles from '../BusinessUserDashboard.module.css'

interface LoadMoreCoursesButtonProps {
  onClick: () => void
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
}

export function LoadMoreCoursesButton({
  onClick,
  orgColors,
  t,
}: LoadMoreCoursesButtonProps) {
  return (
    <div className="mt-5 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className={styles.loadMore}
        style={{ backgroundColor: orgColors.primary, color: orgColors.onPrimary }}
      >
        {t('dashboard.actions.loadMoreCourses', 'Ver mas talleres')}
      </button>
    </div>
  )
}
