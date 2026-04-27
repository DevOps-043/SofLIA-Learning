'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { DashboardLayoutManager } from './DashboardLayoutManager'
import { DashboardPreferences } from './DashboardPreferences'
import {
  StatsCardsWidget,
  MonthlyGrowthWidget,
  ContentDistributionWidget,
  RecentActivityWidget,
} from './StatisticsWidgets'
import { useAdminTheme } from '../hooks/useAdminTheme'
import { AdminPageShell, AdminSectionHeader, AdminSelect, AdminSurface } from './ui'

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
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [layout, setLayout] = useState<DashboardLayout | null>(null)
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    activity_period: '24h',
    growth_chart_metrics: ['users'],
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
        { id: 'recent-activity', type: 'recent-activity', position: { x: 0, y: 6, w: 12, h: 3 } },
      ],
    },
    is_default: true,
  })

  const fetchLayout = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/layout')
      const data = await response.json()

      if (data.success && data.layout) {
        setLayout(data.layout)
      } else {
        setLayout(getDefaultLayout())
      }
    } catch (error) {
      console.error('Error fetching layout:', error)
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
          growth_chart_metrics: data.preferences.growth_chart_metrics || ['users'],
        })
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    }
  }

  const handleLayoutChange = useCallback(async (widgets: WidgetConfig[]) => {
    if (!layout) return

    const updatedLayout = {
      ...layout,
      layout_config: {
        widgets,
      },
    }

    setLayout(updatedLayout)

    try {
      await fetch('/api/admin/dashboard/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedLayout.name,
          layout_config: updatedLayout.layout_config,
          is_default: updatedLayout.is_default,
        }),
      })
    } catch (error) {
      console.error('Error saving layout:', error)
    }
  }, [layout])

  const handlePreferencesChange = useCallback((newPreferences: DashboardPreferences) => {
    setPreferences(newPreferences)
  }, [])

  const renderWidget = (widget: WidgetConfig) => {
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
      <AdminPageShell maxWidth="content">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-lg" style={{ backgroundColor: theme.surfaceSubtle }} />
            ))}
          </div>
          <div className="h-96 rounded-lg" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      </AdminPageShell>
    )
  }

  if (!layout) {
    return (
      <AdminPageShell maxWidth="content">
        <AdminSurface className="p-6 text-sm" style={{ color: theme.danger }}>
          {t('statisticsPage.layoutError')}
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="content">
      <div className="space-y-7">
        <AdminSectionHeader
          size="page"
          icon={ChartBarIcon}
          kicker={t('navigation.statistics')}
          title={t('statisticsPage.title')}
          description={t('statisticsPage.description')}
          actions={(
            <>
              <AdminSelect
                value={growthPeriod}
                onChange={(event) => setGrowthPeriod(parseInt(event.target.value))}
                className="min-w-[180px]"
              >
                <option value="1">{t('statisticsPage.periods.one')}</option>
                <option value="3">{t('statisticsPage.periods.three')}</option>
                <option value="6">{t('statisticsPage.periods.six')}</option>
                <option value="8">{t('statisticsPage.periods.eight')}</option>
                <option value="12">{t('statisticsPage.periods.year')}</option>
              </AdminSelect>
              <DashboardPreferences onPreferencesChange={handlePreferencesChange} />
            </>
          )}
        />

        <DashboardLayoutManager
          widgets={layout.layout_config.widgets}
          onLayoutChange={handleLayoutChange}
        >
          {layout.layout_config.widgets.map((widget) => renderWidget(widget))}
        </DashboardLayoutManager>
      </div>
    </AdminPageShell>
  )
}
