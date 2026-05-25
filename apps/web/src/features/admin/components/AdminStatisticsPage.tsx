'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayoutManager } from './DashboardLayoutManager'
import { DashboardPreferences } from './DashboardPreferences'
import {
  StatsCardsWidget,
  MonthlyGrowthWidget,
  ContentDistributionWidget,
  RecentActivityWidget
} from './StatisticsWidgets'

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

interface DashboardPreferences {
  activity_period: '24h' | '7d' | '30d'
  growth_chart_metrics: string[]
}

export function AdminStatisticsPage() {
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    activity_period: '24h',
    growth_chart_metrics: ['users']
  })
  const [isLoading, setIsLoading] = useState(true)
  const [growthPeriod, setGrowthPeriod] = useState(8)

  useEffect(() => {
    fetchLayout()
    fetchPreferences()
  }, [])

  const getDefaultLayout = (): DashboardLayout => ({
    id: null,
    name: 'Dashboard por Defecto',
    layout_config: {
      widgets: [
        { id: 'stats-cards', type: 'stats', position: { x: 0, y: 0, w: 12, h: 2 } },
        { id: 'monthly-growth', type: 'monthly-growth', position: { x: 0, y: 2, w: 6, h: 4 } },
        { id: 'content-distribution', type: 'content-distribution', position: { x: 6, y: 2, w: 6, h: 4 } },
        { id: 'recent-activity', type: 'recent-activity', position: { x: 0, y: 6, w: 12, h: 3 } }
      ]
    },
    is_default: true
  })

  const fetchLayout = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/layout')
      const data = await response.json()
      
      if (data.success && data.layout) {
        setLayout(data.layout)
      } else {
        // Layout por defecto
        setLayout(getDefaultLayout())
      }
    } catch (error) {
      techDebtLogger.error('Error fetching layout:', error)
      // En caso de error, usar layout por defecto
      setLayout(getDefaultLayout())
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/preferences')
      const data = await response.json()
      
      if (data.success && data.preferences) {
        setPreferences({
          activity_period: data.preferences.activity_period || '24h',
          growth_chart_metrics: data.preferences.growth_chart_metrics || ['users']
        })
      }
    } catch (error) {
      techDebtLogger.error('Error fetching preferences:', error)
    }
  }

  const handleLayoutChange = useCallback(async (widgets: WidgetConfig[]) => {
    if (!layout) return
    
    const updatedLayout = {
      ...layout,
      layout_config: {
        widgets
      }
    }
    
    setLayout(updatedLayout)
    
    // Guardar automáticamente
    try {
      await fetch('/api/admin/dashboard/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updatedLayout.name,
          layout_config: updatedLayout.layout_config,
          is_default: updatedLayout.is_default
        })
      })
    } catch (error) {
      techDebtLogger.error('Error saving layout:', error)
    }
  }, [layout])

  const handlePreferencesChange = useCallback((newPreferences: DashboardPreferences) => {
    setPreferences(newPreferences)
  }, [])

  const renderWidget = (widget: WidgetConfig) => {
    // No aplicar estilos de grid aquí, react-grid-layout los maneja
    switch (widget.type) {
      case 'stats':
        return (
          <div key={widget.id} data-swapy-item={widget.id}>
            <StatsCardsWidget />
          </div>
        )
      case 'monthly-growth':
        return (
          <div key={widget.id} data-swapy-item={widget.id}>
            <MonthlyGrowthWidget 
              period={growthPeriod} 
              metrics={preferences.growth_chart_metrics}
            />
          </div>
        )
      case 'content-distribution':
        return (
          <div key={widget.id} data-swapy-item={widget.id}>
            <ContentDistributionWidget />
          </div>
        )
      case 'recent-activity':
        return (
          <div key={widget.id} data-swapy-item={widget.id}>
            <RecentActivityWidget period={preferences.activity_period} />
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!layout) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">Error al cargar el layout del dashboard</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Estadísticas de la Plataforma
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visualiza las métricas y tendencias de la plataforma
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={growthPeriod}
                onChange={(e) => setGrowthPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="1">Último mes</option>
                <option value="3">Últimos 3 meses</option>
                <option value="6">Últimos 6 meses</option>
                <option value="8">Últimos 8 meses</option>
                <option value="12">Último año</option>
              </select>
              <DashboardPreferences onPreferencesChange={handlePreferencesChange} />
            </div>
          </div>
        </div>

        {/* Dashboard con Layout Manager */}
        <DashboardLayoutManager
          widgets={layout.layout_config.widgets}
          onLayoutChange={handleLayoutChange}
        >
          {layout.layout_config.widgets.map(widget => renderWidget(widget))}
        </DashboardLayoutManager>
      </div>
    </div>
  )
}
