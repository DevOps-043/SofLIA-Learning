import type { ReactNode } from 'react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface DashboardActionButtonProps {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function DashboardActionButton({
  children,
  disabled = false,
  onClick,
  variant = 'secondary',
}: DashboardActionButtonProps) {
  const theme = useBusinessPanelTheme()
  const styles = variant === 'primary'
    ? { backgroundColor: theme.actionColor, color: theme.onActionColor, borderColor: `color-mix(in srgb, ${theme.actionColor} 20%, transparent)` }
    : variant === 'ghost'
      ? { backgroundColor: 'transparent', color: theme.subtextColor, borderColor: theme.borderColor }
      : { backgroundColor: theme.inputBg, color: theme.textColor, borderColor: theme.borderColor }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
      style={styles}
    >
      {children}
    </button>
  )
}
