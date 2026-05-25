import { AlertTriangle } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

interface ReviewErrorStateProps {
  error: string
  title: string
}

export function ReviewErrorState({ error, title }: ReviewErrorStateProps) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div
      className="rounded-3xl border p-8 text-center"
      style={{
        backgroundColor: panelTheme.cardBg,
        borderColor: `color-mix(in srgb, ${panelTheme.dangerColor} 13.3%, transparent)`,
      }}
    >
      <AlertTriangle
        className="w-12 h-12 mx-auto mb-3"
        style={{ color: panelTheme.dangerColor }}
      />
      <p className="font-semibold mb-2" style={{ color: panelTheme.textColor }}>
        {title}
      </p>
      <p style={{ color: panelTheme.subtextColor }}>{error}</p>
    </div>
  )
}
