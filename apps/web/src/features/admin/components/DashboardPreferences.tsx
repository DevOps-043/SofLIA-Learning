'use client'

import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks/useAdminTheme'
import {
  AdminButton,
  AdminFormField,
  AdminModalShell,
  AdminSelect,
} from './ui'

interface DashboardPreferences {
  activity_period: '24h' | '7d' | '30d'
  growth_chart_metrics: string[]
}

interface DashboardPreferencesProps {
  onPreferencesChange?: (preferences: DashboardPreferences) => void
}

export function DashboardPreferences({ onPreferencesChange }: DashboardPreferencesProps) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    activity_period: '24h',
    growth_chart_metrics: ['users'],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const availableMetrics = [
    { id: 'users', label: t('statisticsPage.preferences.metrics.users'), color: theme.chartColors[0] },
    { id: 'courses', label: t('statisticsPage.preferences.metrics.courses'), color: theme.chartColors[1] },
    { id: 'communities', label: t('statisticsPage.preferences.metrics.communities'), color: theme.chartColors[2] },
    { id: 'prompts', label: t('statisticsPage.preferences.metrics.prompts'), color: theme.chartColors[3] },
    { id: 'aiApps', label: t('statisticsPage.preferences.metrics.aiApps'), color: theme.chartColors[4] },
  ]

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/dashboard/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      const data = await response.json()
      if (data.success) {
        onPreferencesChange?.(preferences)
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMetric = (metricId: string) => {
    setPreferences((prev) => {
      const metrics = [...prev.growth_chart_metrics]
      const index = metrics.indexOf(metricId)

      if (index > -1) {
        if (metrics.length === 1) return prev
        metrics.splice(index, 1)
      } else {
        metrics.push(metricId)
      }

      return {
        ...prev,
        growth_chart_metrics: metrics,
      }
    })
  }

  if (isLoading) {
    return null
  }

  return (
    <>
      <AdminButton icon={Settings} onClick={() => setIsOpen(true)} variant="secondary">
        {t('statisticsPage.preferences.button')}
      </AdminButton>

      <AdminModalShell
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        icon={Settings}
        title={t('statisticsPage.preferences.title')}
        footer={(
          <div className="flex justify-end gap-3">
            <AdminButton onClick={() => setIsOpen(false)} variant="secondary">
              {tc('actions.cancel')}
            </AdminButton>
            <AdminButton onClick={handleSave} disabled={isSaving}>
              {isSaving ? tc('actions.saving') : tc('actions.save')}
            </AdminButton>
          </div>
        )}
      >
        <div className="space-y-6">
          <AdminFormField label={t('statisticsPage.preferences.activityPeriod')}>
            <AdminSelect
              value={preferences.activity_period}
              onChange={(event) => setPreferences((prev) => ({
                ...prev,
                activity_period: event.target.value as '24h' | '7d' | '30d',
              }))}
              className="w-full"
            >
              <option value="24h">{t('statisticsPage.preferences.period24h')}</option>
              <option value="7d">{t('statisticsPage.preferences.period7d')}</option>
              <option value="30d">{t('statisticsPage.preferences.period30d')}</option>
            </AdminSelect>
          </AdminFormField>

          <div>
            <h3 className="text-sm font-semibold" style={{ color: theme.text }}>
              {t('statisticsPage.preferences.growthMetrics')}
            </h3>
            <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
              {t('statisticsPage.preferences.growthMetricsHelp')}
            </p>
            <div className="mt-3 space-y-2">
              {availableMetrics.map((metric) => {
                const isSelected = preferences.growth_chart_metrics.includes(metric.id)
                return (
                  <label
                    key={metric.id}
                    className="flex cursor-pointer items-center rounded-xl border p-3 transition"
                    style={{
                      backgroundColor: isSelected ? theme.actionSurface : theme.surfaceSubtle,
                      borderColor: isSelected ? theme.action : theme.border,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMetric(metric.id)}
                      disabled={isSelected && preferences.growth_chart_metrics.length === 1}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: theme.action }}
                    />
                    <span className="ml-3 h-3 w-3 rounded-full" style={{ backgroundColor: metric.color }} />
                    <span className="ml-2 text-sm" style={{ color: theme.text }}>
                      {metric.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </AdminModalShell>
    </>
  )
}
