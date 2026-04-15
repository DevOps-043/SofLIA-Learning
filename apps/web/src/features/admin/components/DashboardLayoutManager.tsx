'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Settings, Save, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
interface GridLayoutItem {
  h: number
  i: string
  minH?: number
  minW?: number
  w: number
  x: number
  y: number
}

type GridLayouts = {
  lg?: GridLayoutItem[]
} & Record<string, GridLayoutItem[] | undefined>

interface ResponsiveLayoutComponentProps {
  children: React.ReactNode
  className: string
  cols: Record<string, number>
  compactType: null | 'horizontal' | 'vertical'
  draggableHandle: string
  isDraggable: boolean
  isResizable: boolean
  layouts: GridLayouts
  margin: [number, number]
  onLayoutChange: (layout: GridLayoutItem[], layouts: GridLayouts) => void
  preventCollision: boolean
  rowHeight: number
}

type ResponsiveLayoutComponent = React.ComponentType<ResponsiveLayoutComponentProps>

interface ReactGridLayoutModule {
  Responsive?: ResponsiveLayoutComponent
  WidthProvider?: (component: ResponsiveLayoutComponent) => ResponsiveLayoutComponent
  default?: ResponsiveLayoutComponent
}

type WidgetChildElement = React.ReactElement<{ 'data-swapy-item'?: string }>

// Importación dinámica de react-grid-layout para evitar problemas SSR
let ResponsiveGridLayout: ResponsiveLayoutComponent | null = null
let ResponsiveLayoutWithWidth: ResponsiveLayoutComponent | null = null

if (typeof window !== 'undefined') {
  try {
    const ReactGridLayout = require('react-grid-layout') as ReactGridLayoutModule
    ResponsiveGridLayout = ReactGridLayout.Responsive || ReactGridLayout.default
    if (ResponsiveGridLayout && ReactGridLayout.WidthProvider) {
      ResponsiveLayoutWithWidth = ReactGridLayout.WidthProvider(ResponsiveGridLayout)
    }
  } catch (error) {
    console.error('Error loading react-grid-layout:', error)
  }
}

interface WidgetConfig {
  id: string
  type: string
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

interface DashboardLayout {
  id: string | null
  name: string
  layout_config: {
    widgets: WidgetConfig[]
  }
  is_default: boolean
}

interface DashboardLayoutManagerProps {
  children: React.ReactNode
  widgets: WidgetConfig[]
  onLayoutChange?: (widgets: WidgetConfig[]) => void
}

export function DashboardLayoutManager({
  children,
  widgets,
  onLayoutChange
}: DashboardLayoutManagerProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentLayout, setCurrentLayout] = useState<GridLayoutItem[]>([])
  const [pendingReset, setPendingReset] = useState(false)
  
  // Convertir children a un mapa para acceso rápido
  const childrenMap = React.useMemo(() => {
    const map = new Map<string, React.ReactElement>()
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps = (child as WidgetChildElement).props
        const widgetId = childProps?.['data-swapy-item']
        if (widgetId) {
          map.set(widgetId, child as React.ReactElement)
        }
      }
    })
    return map
  }, [children])

  // Convertir widgets a formato de react-grid-layout
  useEffect(() => {
    if (widgets && widgets.length > 0) {
      const layout = widgets.map(widget => ({
        i: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.position.w,
        h: widget.position.h,
        minW: 3,
        minH: 2
      }))
      setCurrentLayout(layout)
    } else {
      setCurrentLayout([])
    }
  }, [widgets])

  const handleLayoutChange = useCallback((newLayout: GridLayoutItem[], allLayouts: GridLayouts) => {
    if (!onLayoutChange) return
    
    // ResponsiveGridLayout puede pasar el layout directamente o como objeto con breakpoints
    const layoutToProcess = allLayouts?.lg || newLayout || []
    
    const updatedWidgets = layoutToProcess.map((layoutItem: GridLayoutItem) => {
      const originalWidget = widgets.find(w => w.id === layoutItem.i)
      if (originalWidget) {
        return {
          ...originalWidget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        }
      }
      return originalWidget
    }).filter(Boolean) as WidgetConfig[]
    
    if (updatedWidgets.length > 0) {
      onLayoutChange(updatedWidgets)
    }
  }, [widgets, onLayoutChange])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/dashboard/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Mi Dashboard Personalizado',
          layout_config: {
            widgets: widgets
          },
          is_default: true
        })
      })

      const data = await response.json()
      if (data.success) {
        setIsEditMode(false)
      }
    } catch (error) {
      console.error('Error saving layout:', error)
    } finally {
      setIsSaving(false)
    }
  }, [widgets])

  const handleReset = useCallback(() => {
    setPendingReset(true)
  }, [])

  const handleConfirmReset = useCallback(async () => {
    setPendingReset(false)
    try {
      await fetch('/api/admin/dashboard/layout', {
        method: 'DELETE'
      })

      // Recargar la página para aplicar el layout por defecto
      window.location.reload()
    } catch (error) {
      console.error('Error resetting layout:', error)
    }
  }, [])

  return (
    <div className="relative">
      {/* Confirmación inline de reset */}
      {pendingReset && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-3">
          <p className="text-sm text-red-700 dark:text-red-400">{t('dashboard.confirmResetLayout')}</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setPendingReset(false)} className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded hover:bg-red-50 transition-colors">{tc('actions.cancel')}</button>
            <button onClick={handleConfirmReset} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">{tc('actions.confirm')}</button>
          </div>
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="flex justify-end gap-2 mb-4">
        {!isEditMode ? (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            {t('dashboard.customizeLayout')}
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? tc('actions.saving') : tc('actions.save')}
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {tc('actions.cancel')}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('dashboard.restoreLayout')}
            </button>
          </>
        )}
      </div>

      {/* Contenedor con react-grid-layout */}
      {typeof window !== 'undefined' && ResponsiveLayoutWithWidth && widgets.length > 0 && currentLayout.length > 0 ? (
        <div className="w-full">
          <ResponsiveLayoutWithWidth
            className="layout"
            layouts={{ lg: currentLayout }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            margin={[24, 24]}
            compactType={null}
            preventCollision={false}
          >
            {widgets.map((widget) => {
              // Obtener el child correspondiente del mapa
              const child = childrenMap.get(widget.id)
              
              if (!child) {
                console.warn(`Widget ${widget.id} no tiene child correspondiente. Children disponibles:`, Array.from(childrenMap.keys()))
                return null
              }
              
              // El key debe coincidir exactamente con el 'i' en el layout para que react-grid-layout funcione
              return (
                <div key={widget.id} className="relative">
                  {isEditMode && (
                    <div className="drag-handle absolute top-2 right-2 cursor-move z-10 p-2 bg-blue-600 text-white rounded shadow-lg hover:bg-blue-700 transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                  )}
                  {child}
                </div>
              )
            })}
          </ResponsiveLayoutWithWidth>
          <style dangerouslySetInnerHTML={{__html: `
            .react-grid-layout {
              position: relative;
            }
            .react-grid-item {
              transition: all 200ms ease;
              transition-property: left, top, width, height;
            }
            .react-grid-item.cssTransforms {
              transition-property: transform, width, height;
            }
            .react-grid-item.resizing {
              transition: none;
              z-index: 1;
              will-change: width, height;
            }
            .react-grid-item.react-draggable-dragging {
              transition: none;
              z-index: 3;
              will-change: transform;
            }
            .react-grid-item.dropping {
              visibility: hidden;
            }
            .react-grid-item.react-grid-placeholder {
              background: rgb(59, 130, 246);
              opacity: 0.2;
              transition-duration: 100ms;
              z-index: 2;
              -webkit-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              -o-user-select: none;
              user-select: none;
              border-radius: 0.5rem;
            }
            .react-grid-item > .react-resizable-handle {
              position: absolute;
              width: 20px;
              height: 20px;
              bottom: 0;
              right: 0;
              cursor: se-resize;
            }
            .react-grid-item > .react-resizable-handle::after {
              content: "";
              position: absolute;
              right: 3px;
              bottom: 3px;
              width: 5px;
              height: 5px;
              border-right: 2px solid rgba(0, 0, 0, 0.4);
              border-bottom: 2px solid rgba(0, 0, 0, 0.4);
            }
          `}} />
        </div>
      ) : widgets.length > 0 ? (
        // Fallback cuando react-grid-layout no está disponible pero hay widgets
        <div className="grid grid-cols-12 gap-6">
          {widgets.map((widget) => {
            const child = childrenMap.get(widget.id)
            if (!child) {
              return null
            }
            const colSpan = widget.position.w
            return (
              <div 
                key={widget.id} 
                className="relative"
                style={{ gridColumn: `span ${colSpan}` }}
              >
                {child}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay widgets para mostrar
        </div>
      )}

      {isEditMode && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Modo edición activado: Arrastra los widgets desde el ícono de configuración para reorganizarlos. También puedes redimensionarlos desde las esquinas.
          </p>
        </div>
      )}
    </div>
  )
}
