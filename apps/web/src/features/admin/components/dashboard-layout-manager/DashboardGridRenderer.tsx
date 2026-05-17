import type React from 'react';
import { Settings } from 'lucide-react';
import { DashboardGridStyles } from './DashboardGridStyles';
import { getResponsiveLayoutWithWidth } from './grid-layout-loader';
import type { GridLayoutItem, GridLayouts, WidgetConfig } from './types';

interface DashboardGridRendererProps {
  childrenMap: Map<string, React.ReactElement>;
  currentLayout: GridLayoutItem[];
  isEditMode: boolean;
  onLayoutChange: (layout: GridLayoutItem[], layouts: GridLayouts) => void;
  widgets: WidgetConfig[];
}

export function DashboardGridRenderer({
  childrenMap,
  currentLayout,
  isEditMode,
  onLayoutChange,
  widgets
}: DashboardGridRendererProps) {
  const ResponsiveLayoutWithWidth = getResponsiveLayoutWithWidth();
  const canUseResponsiveGrid =
    typeof window !== 'undefined' &&
    ResponsiveLayoutWithWidth &&
    widgets.length > 0 &&
    currentLayout.length > 0;

  if (canUseResponsiveGrid) {
    return (
      <div className="w-full">
        <ResponsiveLayoutWithWidth
          className="layout"
          layouts={{ lg: currentLayout }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          margin={[24, 24]}
          compactType={null}
          preventCollision={false}
        >
          {widgets.map((widget) => renderGridChild(widget, childrenMap, isEditMode))}
        </ResponsiveLayoutWithWidth>
        <DashboardGridStyles />
      </div>
    );
  }

  if (widgets.length > 0) {
    return <FallbackWidgetGrid childrenMap={childrenMap} widgets={widgets} />;
  }

  return (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      No hay widgets para mostrar
    </div>
  );
}

function renderGridChild(
  widget: WidgetConfig,
  childrenMap: Map<string, React.ReactElement>,
  isEditMode: boolean
) {
  const child = childrenMap.get(widget.id);
  if (!child) {
    console.warn(`Widget ${widget.id} no tiene child correspondiente.`);
    return null;
  }

  return (
    <div key={widget.id} className="relative">
      {isEditMode && (
        <div className="drag-handle absolute top-2 right-2 cursor-move z-10 p-2 bg-blue-600 text-white rounded shadow-lg hover:bg-blue-700 transition-colors">
          <Settings className="w-4 h-4" />
        </div>
      )}
      {child}
    </div>
  );
}

function FallbackWidgetGrid({ childrenMap, widgets }: Pick<DashboardGridRendererProps, 'childrenMap' | 'widgets'>) {
  return (
    <div className="grid grid-cols-12 gap-6">
      {widgets.map((widget) => {
        const child = childrenMap.get(widget.id);
        return child ? (
          <div key={widget.id} className="relative" style={{ gridColumn: `span ${widget.position.w}` }}>
            {child}
          </div>
        ) : null;
      })}
    </div>
  );
}
