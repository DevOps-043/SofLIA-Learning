import { X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { getWidgetType, WIDGET_META } from './widget-meta'
import { WidgetContent } from './WidgetContent'

interface DashboardWidgetCardProps {
  isEditMode: boolean
  onRemoveWidget: (widgetId: string) => void
  widgetId: string
}

export function DashboardWidgetCard({ isEditMode, onRemoveWidget, widgetId }: DashboardWidgetCardProps) {
  const theme = useBusinessPanelTheme()
  const widgetType = getWidgetType(widgetId)
  const widgetLabel = widgetType ? WIDGET_META[widgetType].label : 'Widget personalizado'

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      {isEditMode && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: theme.subtextColor }}>{widgetLabel}</span>
          <button type="button" onClick={() => onRemoveWidget(widgetId)} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors" style={{ backgroundColor: `${theme.dangerColor}12`, color: theme.dangerColor }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <WidgetContent widgetId={widgetId} />
    </div>
  )
}
