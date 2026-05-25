import React from 'react';
import type { GridLayoutItem, GridLayouts, WidgetChildElement, WidgetConfig } from './types';

export function createChildrenMap(children: React.ReactNode) {
  const map = new Map<string, React.ReactElement>();

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    const childProps = (child as WidgetChildElement).props;
    const widgetId = childProps?.['data-swapy-item'];
    if (widgetId) {
      map.set(widgetId, child as React.ReactElement);
    }
  });

  return map;
}

export function widgetsToLayout(widgets: WidgetConfig[]): GridLayoutItem[] {
  return widgets.map((widget) => ({
    h: widget.position.h,
    i: widget.id,
    minH: 2,
    minW: 3,
    w: widget.position.w,
    x: widget.position.x,
    y: widget.position.y
  }));
}

export function mergeLayoutIntoWidgets(
  newLayout: GridLayoutItem[],
  allLayouts: GridLayouts,
  widgets: WidgetConfig[]
) {
  const layoutToProcess = allLayouts?.lg || newLayout || [];

  return layoutToProcess
    .map((layoutItem) => {
      const originalWidget = widgets.find((widget) => widget.id === layoutItem.i);
      if (!originalWidget) {
        return null;
      }

      return {
        ...originalWidget,
        position: {
          h: layoutItem.h,
          w: layoutItem.w,
          x: layoutItem.x,
          y: layoutItem.y
        }
      };
    })
    .filter(Boolean) as WidgetConfig[];
}
