'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  RefreshCw,
  Layout,
  X,
  Plus,
  BarChart3,
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Clock,
  Award,
  Activity
} from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'

// Importación dinámica de react-grid-layout para evitar problemas SSR
let ResponsiveGridLayout: any = null
let WidthProvider: any = null

if (typeof window !== 'undefined') {
  const ReactGridLayout = require('react-grid-layout')
  ResponsiveGridLayout = ReactGridLayout.default
  WidthProvider = ReactGridLayout.WidthProvider(ResponsiveGridLayout.default)
}

interface WidgetConfig {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  static?: boolean
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

export function CustomDashboard({ onClose }: CustomDashboardProps) {
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const [isEditMode, setIsEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    fetchLayout()
  }, [])

  const fetchLayout = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success && data.layout) {
        setLayout(data.layout)
      } else {
        setError(data.error || 'Error al cargar layout')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar layout')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLayoutChange = useCallback((newLayout: WidgetConfig[]) => {
    if (!layout) return
    
    setLayout({
      ...layout,
      layout_config: {
        widgets: newLayout
      }
    })
  }, [layout])

  const handleSave = async () => {
    if (!layout) return

    try {
      setIsSaving(true)
      setError(null)
      setSaveSuccess(false)

      const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: layout.name,
          layout_config: layout.layout_config,
          is_default: layout.is_default
        })
      })

      const data = await response.json()

      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => {
          setSaveSuccess(false)
          setIsEditMode(false)
        }, 2000)
      } else {
        setError(data.error || 'Error al guardar layout')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar layout')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('¿Estás seguro de que deseas restablecer el layout por defecto? Esto eliminará tu personalización actual.')) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        await fetchLayout()
        setIsEditMode(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        setError(data.error || 'Error al restablecer layout')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer layout')
    } finally {
      setIsSaving(false)
    }
  }

  const addWidget = (widgetType: string) => {
    if (!layout) return

    const widgets = layout.layout_config.widgets || []
    const newWidget: WidgetConfig = {
      i: `${widgetType}-${Date.now()}`,
      x: 0,
      y: widgets.length > 0 ? Math.max(...widgets.map(w => w.y + w.h)) : 0,
      w: 4,
      h: 3,
      minW: 2,
      minH: 2
    }

    setLayout({
      ...layout,
      layout_config: {
        widgets: [...widgets, newWidget]
      }
    })
  }

  const removeWidget = (widgetId: string) => {
    if (!layout) return

    setLayout({
      ...layout,
      layout_config: {
        widgets: layout.layout_config.widgets.filter(w => w.i !== widgetId)
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error && !layout) {
    return (
      <div className="text-center py-20">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <button
          onClick={fetchLayout}
          className="px-4 py-2 text-white rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--org-primary-button-color, #3b82f6)',
            opacity: 0.2
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.3')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.2')}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary" />
            Dashboard Personalizable
          </h2>
          <p className="text-carbon-400 mt-1">
            Arrastra y organiza los widgets según tus necesidades
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Guardado exitosamente</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400"
            >
              {error}
            </motion.div>
          )}
          <Button
            variant={isEditMode ? 'gradient' : 'outline'}
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {isEditMode ? 'Vista Previa' : 'Personalizar'}
          </Button>
          {isEditMode && (
            <>
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Restablecer
              </Button>
              <Button
                variant="gradient"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </>
          )}
          {onClose && (
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Agregar Widgets (solo en modo edición) */}
      {isEditMode && (
        <div className="bg-carbon-900 rounded-lg p-4 border border-carbon-700">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-carbon-300 font-medium">Agregar Widget:</span>
            <button
              onClick={() => addWidget('stats')}
              className="px-3 py-2 bg-carbon-800 hover:bg-carbon-700 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </button>
            <button
              onClick={() => addWidget('users')}
              className="px-3 py-2 bg-carbon-800 hover:bg-carbon-700 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              Usuarios
            </button>
            <button
              onClick={() => addWidget('courses')}
              className="px-3 py-2 bg-carbon-800 hover:bg-carbon-700 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Cursos
            </button>
            <button
              onClick={() => addWidget('activity')}
              className="px-3 py-2 bg-carbon-800 hover:bg-carbon-700 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <Activity className="w-4 h-4" />
              Actividad
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      {typeof window !== 'undefined' && ResponsiveGridLayout && WidthProvider ? (
        <WidthProvider className="layout" cols={12} rowHeight={60}>
          <ResponsiveGridLayout
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
            {widgets.map(widget => (
              <div key={widget.i} className="bg-carbon-900 rounded-lg border border-carbon-700 p-4">
                {isEditMode && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-carbon-400 text-sm font-medium">
                      {getWidgetName(widget.i)}
                    </span>
                    <button
                      onClick={() => removeWidget(widget.i)}
                      className="w-6 h-6 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <WidgetContent widgetId={widget.i} />
              </div>
            ))}
          </ResponsiveGridLayout>
        </WidthProvider>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map(widget => (
            <div key={widget.i} className="bg-carbon-900 rounded-lg border border-carbon-700 p-4">
              {isEditMode && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-carbon-400 text-sm font-medium">
                    {getWidgetName(widget.i)}
                  </span>
                  <button
                    onClick={() => removeWidget(widget.i)}
                    className="w-6 h-6 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <WidgetContent widgetId={widget.i} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function WidgetContent({ widgetId }: { widgetId: string }) {
  const widgetType = widgetId.split('-')[0]

  switch (widgetType) {
    case 'stats':
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-carbon-400 text-sm">Widget de Estadísticas</p>
          </div>
        </div>
      )
    case 'users':
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-carbon-400 text-sm">Widget de Usuarios</p>
          </div>
        </div>
      )
    case 'courses':
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-carbon-400 text-sm">Widget de Cursos</p>
          </div>
        </div>
      )
    case 'activity':
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-carbon-400 text-sm">Widget de Actividad</p>
          </div>
        </div>
      )
    default:
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-carbon-400 text-sm">Widget personalizado</p>
        </div>
      )
  }
}

function getWidgetName(widgetId: string): string {
  const widgetType = widgetId.split('-')[0]
  const names: Record<string, string> = {
    'stats': 'Estadísticas',
    'users': 'Usuarios',
    'courses': 'Cursos',
    'activity': 'Actividad'
  }
  return names[widgetType] || 'Widget Personalizado'
}

