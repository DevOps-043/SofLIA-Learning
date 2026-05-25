import type { WidgetConfig } from './custom-dashboard.types'
import { DashboardWidgetCard } from './DashboardWidgetCard'
import { ResponsiveGrid } from './responsive-grid'

interface DashboardGridProps {
  isEditMode: boolean
  onLayoutChange: (layout: WidgetConfig[]) => void
  onRemoveWidget: (widgetId: string) => void
  widgets: WidgetConfig[]
}

export function DashboardGrid({
  isEditMode,
  onLayoutChange,
  onRemoveWidget,
  widgets,
}: DashboardGridProps) {
  if (typeof window !== 'undefined' && ResponsiveGrid) {
    return (
      <ResponsiveGrid
        className="layout"
        layouts={{ lg: widgets }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={onLayoutChange}
        draggableHandle={isEditMode ? undefined : '.drag-handle'}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {widgets.map(widget => (
          <DashboardWidgetCard key={widget.i} widgetId={widget.i} isEditMode={isEditMode} onRemoveWidget={onRemoveWidget} />
        ))}
      </ResponsiveGrid>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {widgets.map(widget => (
        <DashboardWidgetCard key={widget.i} widgetId={widget.i} isEditMode={isEditMode} onRemoveWidget={onRemoveWidget} />
      ))}
    </div>
  )
}
