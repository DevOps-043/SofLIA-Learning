'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { Settings, X } from 'lucide-react'

interface DashboardPreferences {
  activity_period: '24h' | '7d' | '30d'
  growth_chart_metrics: string[]
}

interface DashboardPreferencesProps {
  onPreferencesChange?: (preferences: DashboardPreferences) => void
}

const AVAILABLE_METRICS = [
  { id: 'users', label: 'Usuarios', color: '#3b82f6' },
  { id: 'courses', label: 'Talleres', color: '#10b981' },
  { id: 'communities', label: 'Comunidades', color: '#8b5cf6' },
  { id: 'prompts', label: 'Prompts', color: '#f97316' },
  { id: 'aiApps', label: 'Apps de IA', color: '#ec4899' }
]

export function DashboardPreferences({ onPreferencesChange }: DashboardPreferencesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preferences, setPreferences] = useState<DashboardPreferences>({
    activity_period: '24h',
    growth_chart_metrics: ['users']
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
          growth_chart_metrics: data.preferences.growth_chart_metrics || ['users']
        })
      }
    } catch (error) {
      techDebtLogger.error('Error fetching preferences:', error)
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      })

      const data = await response.json()
      if (data.success) {
        if (onPreferencesChange) {
          onPreferencesChange(preferences)
        }
        setIsOpen(false)
      }
    } catch (error) {
      techDebtLogger.error('Error saving preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleMetric = (metricId: string) => {
    setPreferences(prev => {
      const metrics = [...prev.growth_chart_metrics]
      const index = metrics.indexOf(metricId)
      
      if (index > -1) {
        // Si solo queda una métrica, no permitir eliminarla
        if (metrics.length === 1) return prev
        metrics.splice(index, 1)
      } else {
        metrics.push(metricId)
      }
      
      return {
        ...prev,
        growth_chart_metrics: metrics
      }
    })
  }

  if (isLoading) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <Settings className="w-4 h-4" />
        Preferencias
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Preferencias del Dashboard
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Período de actividad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período de Actividad Reciente
                </label>
                <select
                  value={preferences.activity_period}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    activity_period: e.target.value as '24h' | '7d' | '30d'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="24h">Últimas 24 horas</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                </select>
              </div>

              {/* Métricas del gráfico de crecimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Métricas del Gráfico de Crecimiento
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Selecciona las métricas que deseas mostrar en el gráfico de crecimiento mensual
                </p>
                <div className="space-y-2">
                  {AVAILABLE_METRICS.map((metric) => {
                    const isSelected = preferences.growth_chart_metrics.includes(metric.id)
                    return (
                      <label
                        key={metric.id}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMetric(metric.id)}
                          disabled={isSelected && preferences.growth_chart_metrics.length === 1}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div
                          className="w-3 h-3 rounded-full ml-3"
                          style={{ backgroundColor: metric.color }}
                        ></div>
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {metric.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

