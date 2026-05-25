import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

interface InfoPillProps {
  label: string
  value: string
}

export function InfoPill({ label, value }: InfoPillProps) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div
      className="rounded-2xl border px-3 py-2"
      style={{
        backgroundColor: panelTheme.hoverBg,
        borderColor: panelTheme.borderColor,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: panelTheme.mutedTextColor }}
      >
        {label}
      </p>
      <p className="text-sm font-medium truncate mt-1" style={{ color: panelTheme.textColor }}>
        {value}
      </p>
    </div>
  )
}
