'use client'

import type { ComponentType, ReactNode } from 'react'
import type * as ReactGridLayout from 'react-grid-layout'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle,
  Layout,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

type WidgetConfig = ReactGridLayout.Layout
type ResponsiveGridLayoutProps = ReactGridLayout.ResponsiveProps
type WidthProviderProps = ReactGridLayout.WidthProviderProps
type WidgetType = 'stats' | 'users' | 'courses' | 'activity'

interface ReactGridLayoutModule {
  default: ComponentType<ResponsiveGridLayoutProps>
  WidthProvider: <P>(
    component: ComponentType<P>
  ) => ComponentType<P & WidthProviderProps>
}

interface DashboardLayout {
  id: string | null
  name: string
  layout_config: {
    widgets: WidgetConfig[]
  }
  is_default: boolean
}

interface CustomDashboardProps {
  onClose?: () => void
}

const WIDGET_META: Record<
  WidgetType,
  {
    label: string
    description: string
    icon: typeof BarChart3
  }
> = {
  stats: {
    label: 'Estadísticas',
    description: 'Resumen de métricas clave',
    icon: BarChart3,
  },
  users: {
    label: 'Usuarios',
    description: 'Actividad y crecimiento',
    icon: Users,
  },
  courses: {
    label: 'Cursos',
    description: 'Avance y asignaciones',
    icon: BookOpen,
  },
  activity: {
    label: 'Actividad',
    description: 'Eventos recientes del panel',
    icon: Activity,
  },
}

let ResponsiveGrid: ComponentType<ResponsiveGridLayoutProps & WidthProviderProps> | null = null

if (typeof window !== 'undefined') {
  const reactGridLayout = require('react-grid-layout') as ReactGridLayoutModule
  ResponsiveGrid = reactGridLayout.WidthProvider(reactGridLayout.default)
}

function getWidgetType(widgetId: string): WidgetType | null {
  const widgetType = widgetId.split('-')[0]
  return widgetType in WIDGET_META ? (widgetType as WidgetType) : null
}

function DashboardActionButton({
  children,
  onClick,
  disabled = false,
  variant = 'secondary',
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const theme = useBusinessPanelTheme()

  const styles =
    variant === 'primary'
      ? {
          backgroundColor: theme.actionColor,
          color: theme.onActionColor,
          borderColor: `${theme.actionColor}33`,
        }
      : variant === 'ghost'
        ? {
            backgroundColor: 'transparent',
            color: theme.subtextColor,
            borderColor: theme.borderColor,
          }
        : {
            backgroundColor: theme.inputBg,
            color: theme.textColor,
            borderColor: theme.borderColor,
          }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
      style={styles}
    >
      {children}
    </button>
  )
}

function WidgetContent({ widgetId }: { widgetId: string }) {
  const theme = useBusinessPanelTheme()
  const widgetType = getWidgetType(widgetId)

  if (!widgetType) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          Widget personalizado
        </p>
      </div>
    )
  }

  const widgetMeta = WIDGET_META[widgetType]
  const Icon = widgetMeta.icon

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: theme.actionSurface }}
        >
          <Icon className="h-7 w-7" style={{ color: theme.actionColor }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
          {widgetMeta.label}
        </p>
        <p className="mt-1 text-xs" style={{ color: theme.subtextColor }}>
          {widgetMeta.description}
        </p>
      </div>
    </div>
  )
}

export function CustomDashboard({ onClose }: CustomDashboardProps) {
  const theme = useBusinessPanelTheme()
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const [isEditMode, setIsEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    void fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success && data.layout) {
        setLayout(data.layout)
      } else {
        setError(data.error || 'Error al cargar el layout')
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Error al cargar el layout')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLayoutChange = useCallback((newLayout: WidgetConfig[]) => {
    setLayout(currentLayout => {
      if (!currentLayout) {
        return currentLayout
      }

      return {
        ...currentLayout,
        layout_config: {
          widgets: newLayout,
        },
      }
    })
  }, [])

  const handleSave = async () => {
    if (!layout) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSaveSuccess(false)

      const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: layout.name,
          layout_config: layout.layout_config,
          is_default: layout.is_default,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSaveSuccess(true)
        window.setTimeout(() => {
          setSaveSuccess(false)
          setIsEditMode(false)
        }, 2000)
      } else {
        setError(data.error || 'Error al guardar el layout')
      }
    } catch (saveIssue) {
      setError(saveIssue instanceof Error ? saveIssue.message : 'Error al guardar el layout')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas restablecer el layout por defecto? Esto eliminará tu personalización actual.'
    )

    if (!confirmed) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        await fetchLayout()
        setIsEditMode(false)
        setSaveSuccess(true)
        window.setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setError(data.error || 'Error al restablecer el layout')
      }
    } catch (resetIssue) {
      setError(resetIssue instanceof Error ? resetIssue.message : 'Error al restablecer el layout')
    } finally {
      setIsSaving(false)
    }
  }

  const addWidget = (widgetType: WidgetType) => {
    setLayout(currentLayout => {
      if (!currentLayout) {
        return currentLayout
      }

      const widgets = currentLayout.layout_config.widgets || []
      const newWidget: WidgetConfig = {
        i: `${widgetType}-${Date.now()}`,
        x: 0,
        y: widgets.length > 0 ? Math.max(...widgets.map(widget => widget.y + widget.h)) : 0,
        w: 4,
        h: 3,
        minW: 2,
        minH: 2,
      }

      return {
        ...currentLayout,
        layout_config: {
          widgets: [...widgets, newWidget],
        },
      }
    })
  }

  const removeWidget = (widgetId: string) => {
    setLayout(currentLayout => {
      if (!currentLayout) {
        return currentLayout
      }

      return {
        ...currentLayout,
        layout_config: {
          widgets: currentLayout.layout_config.widgets.filter(widget => widget.i !== widgetId),
        },
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-16 w-16 animate-spin rounded-full border-4"
          style={{
            borderColor: `${theme.actionColor}33`,
            borderTopColor: theme.actionColor,
          }}
        />
      </div>
    )
  }

  if (error && !layout) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-lg" style={{ color: theme.dangerColor }}>
          {error}
        </div>
        <button
          type="button"
          onClick={() => void fetchLayout()}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{
            backgroundColor: theme.actionColor,
            color: theme.onActionColor,
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!layout) {
    return null
  }

  const widgets = layout.layout_config.widgets || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold" style={{ color: theme.textColor }}>
            <Layout className="h-6 w-6" style={{ color: theme.actionColor }} />
            Dashboard personalizable
          </h2>
          <p className="mt-1" style={{ color: theme.subtextColor }}>
            Arrastra y organiza los widgets según tus necesidades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {saveSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg border px-4 py-2"
              style={{
                backgroundColor: `${theme.successColor}12`,
                borderColor: `${theme.successColor}33`,
                color: theme.successColor,
              }}
            >
              <CheckCircle className="h-5 w-5" />
              <span>Guardado exitosamente</span>
            </motion.div>
          ) : null}

          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border px-4 py-2"
              style={{
                backgroundColor: `${theme.dangerColor}12`,
                borderColor: `${theme.dangerColor}33`,
                color: theme.dangerColor,
              }}
            >
              {error}
            </motion.div>
          ) : null}

          <DashboardActionButton
            variant={isEditMode ? 'primary' : 'secondary'}
            onClick={() => setIsEditMode(current => !current)}
          >
            <Settings className="h-4 w-4" />
            {isEditMode ? 'Vista previa' : 'Personalizar'}
          </DashboardActionButton>

          {isEditMode ? (
            <>
              <DashboardActionButton variant="secondary" onClick={() => void handleReset()} disabled={isSaving}>
                <RefreshCw className="h-4 w-4" />
                Restablecer
              </DashboardActionButton>
              <DashboardActionButton variant="primary" onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2"
                      style={{
                        borderColor: `${theme.onActionColor}4D`,
                        borderTopColor: theme.onActionColor,
                      }}
                    />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </DashboardActionButton>
            </>
          ) : null}

          {onClose ? (
            <DashboardActionButton variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </DashboardActionButton>
          ) : null}
        </div>
      </div>

      {isEditMode ? (
        <div
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium" style={{ color: theme.textColor }}>
              Agregar widget:
            </span>
            {(Object.keys(WIDGET_META) as WidgetType[]).map(widgetType => {
              const widgetMeta = WIDGET_META[widgetType]
              const Icon = widgetMeta.icon

              return (
                <button
                  key={widgetType}
                  type="button"
                  onClick={() => addWidget(widgetType)}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }}
                >
                  <Plus className="h-4 w-4" style={{ color: theme.actionColor }} />
                  <Icon className="h-4 w-4" style={{ color: theme.actionColor }} />
                  {widgetMeta.label}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {typeof window !== 'undefined' && ResponsiveGrid ? (
        <ResponsiveGrid
          className="layout"
          layouts={{ lg: widgets }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle={isEditMode ? undefined : '.drag-handle'}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {widgets.map(widget => {
            const widgetType = getWidgetType(widget.i)
            const widgetLabel = widgetType ? WIDGET_META[widgetType].label : 'Widget personalizado'

            return (
              <div
                key={widget.i}
                className="rounded-2xl border p-4"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
              >
                {isEditMode ? (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: theme.subtextColor }}>
                      {widgetLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeWidget(widget.i)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{
                        backgroundColor: `${theme.dangerColor}12`,
                        color: theme.dangerColor,
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                <WidgetContent widgetId={widget.i} />
              </div>
            )
          })}
        </ResponsiveGrid>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map(widget => {
            const widgetType = getWidgetType(widget.i)
            const widgetLabel = widgetType ? WIDGET_META[widgetType].label : 'Widget personalizado'

            return (
              <div
                key={widget.i}
                className="rounded-2xl border p-4"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                }}
              >
                {isEditMode ? (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: theme.subtextColor }}>
                      {widgetLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeWidget(widget.i)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                      style={{
                        backgroundColor: `${theme.dangerColor}12`,
                        color: theme.dangerColor,
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
                <WidgetContent widgetId={widget.i} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
