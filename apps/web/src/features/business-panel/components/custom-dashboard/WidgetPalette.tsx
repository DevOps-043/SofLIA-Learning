import { Plus } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { WidgetType } from './custom-dashboard.types'
import { WIDGET_META } from './widget-meta'

interface WidgetPaletteProps {
  onAddWidget: (widgetType: WidgetType) => void
  t: (key: string) => string
}

export function WidgetPalette({ onAddWidget, t }: WidgetPaletteProps) {
  const theme = useBusinessPanelTheme()

  return (
    <div className="rounded-2xl border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium" style={{ color: theme.textColor }}>{t('dashboard.addWidget')}</span>
        {(Object.keys(WIDGET_META) as WidgetType[]).map(widgetType => {
          const widgetMeta = WIDGET_META[widgetType]
          const Icon = widgetMeta.icon
          return (
            <button key={widgetType} type="button" onClick={() => onAddWidget(widgetType)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
              <Plus className="h-4 w-4" style={{ color: theme.actionColor }} />
              <Icon className="h-4 w-4" style={{ color: theme.actionColor }} />
              {widgetMeta.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
