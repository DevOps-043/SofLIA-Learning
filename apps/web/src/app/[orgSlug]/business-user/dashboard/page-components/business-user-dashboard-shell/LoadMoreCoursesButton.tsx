import type { BusinessUserDashboardShellProps } from './types'

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
        className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
        style={{
          borderColor: orgColors.border,
          backgroundColor: orgColors.cardBg,
          color: orgColors.text,
        }}
      >
        {t('dashboard.actions.loadMoreCourses', 'Ver mas talleres')}
      </button>
    </div>
  )
}
