import type { DashboardLayout, WidgetConfig, WidgetType } from './custom-dashboard.types'

export function replaceWidgets(layout: DashboardLayout | null, widgets: WidgetConfig[]) {
  if (!layout) return layout
  return { ...layout, layout_config: { widgets } }
}

export function addWidgetToLayout(layout: DashboardLayout | null, widgetType: WidgetType) {
  if (!layout) return layout

  const widgets = layout.layout_config.widgets || []
  const newWidget: WidgetConfig = {
    i: `${widgetType}-${Date.now()}`,
    x: 0,
    y: widgets.length > 0 ? Math.max(...widgets.map(widget => widget.y + widget.h)) : 0,
    w: 4,
    h: 3,
    minW: 2,
    minH: 2,
  }

  return replaceWidgets(layout, [...widgets, newWidget])
}

export function removeWidgetFromLayout(layout: DashboardLayout | null, widgetId: string) {
  if (!layout) return layout
  return replaceWidgets(layout, layout.layout_config.widgets.filter(widget => widget.i !== widgetId))
}
