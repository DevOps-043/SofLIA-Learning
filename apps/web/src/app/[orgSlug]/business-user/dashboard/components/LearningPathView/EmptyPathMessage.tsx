import type { BusinessUserDashboardColors } from '../../types'

interface EmptyPathMessageProps {
  message: string
  orgColors: BusinessUserDashboardColors
}

export function EmptyPathMessage({ message, orgColors }: EmptyPathMessageProps) {
  return (
    <div
      className="w-full rounded-md border px-4 py-5 text-sm"
      style={{
        backgroundColor: orgColors.cardBg,
        borderColor: orgColors.border,
        color: orgColors.textSecondary,
      }}
    >
      {message}
    </div>
  )
}
