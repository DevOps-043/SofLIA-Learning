import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { getWidgetType, WIDGET_META } from './widget-meta'

export function WidgetContent({ widgetId }: { widgetId: string }) {
  const theme = useBusinessPanelTheme()
  const widgetType = getWidgetType(widgetId)

  if (!widgetType) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm" style={{ color: theme.subtextColor }}>Widget personalizado</p>
      </div>
    )
  }

  const widgetMeta = WIDGET_META[widgetType]
  const Icon = widgetMeta.icon

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: theme.actionSurface }}>
          <Icon className="h-7 w-7" style={{ color: theme.actionColor }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: theme.textColor }}>{widgetMeta.label}</p>
        <p className="mt-1 text-xs" style={{ color: theme.subtextColor }}>{widgetMeta.description}</p>
      </div>
    </div>
  )
}
