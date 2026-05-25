import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

interface ReviewHeaderProps {
  title: string
  subtitle: string
}

export function ReviewHeader({ title, subtitle }: ReviewHeaderProps) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div id="tour-reviews-header" className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight" style={{ color: panelTheme.textColor }}>
        {title}
      </h1>
      <p className="text-base" style={{ color: panelTheme.subtextColor }}>
        {subtitle}
      </p>
    </div>
  )
}
