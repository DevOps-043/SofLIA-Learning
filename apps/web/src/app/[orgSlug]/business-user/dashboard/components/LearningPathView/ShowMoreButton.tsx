import type { BusinessUserDashboardColors } from '../../types'

interface ShowMoreButtonProps {
  label: string
  onClick: () => void
  orgColors: BusinessUserDashboardColors
}

export function ShowMoreButton({ label, onClick, orgColors }: ShowMoreButtonProps) {
  return (
    <div className="mt-3 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
        style={{
          backgroundColor: orgColors.cardBg,
          borderColor: orgColors.border,
          color: orgColors.text,
        }}
      >
        {label}
      </button>
    </div>
  )
}
