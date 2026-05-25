'use client'

import { useEffect, useState } from 'react'
import { CalendarIcon } from '@heroicons/react/24/outline'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface MonthlyGrowthData {
  month: string
  monthNumber: number
  year: number
  users: number
  courses: number
  communities: number
  prompts: number
  aiApps: number
}

interface MonthlyGrowthWidgetProps {
  period?: number
  metrics?: string[]
}

const metricConfig: Record<string, { color: string; label: string }> = {
  aiApps: { color: 'var(--color-error)', label: 'Apps de IA' },
  communities: { color: 'var(--color-accent)', label: 'Comunidades' },
  courses: { color: 'var(--color-success)', label: 'Talleres' },
  prompts: { color: 'var(--color-warning)', label: 'Prompts' },
  users: { color: 'var(--color-primary)', label: 'Usuarios' },
}

export function MonthlyGrowthWidget({ period = 8, metrics = ['users'] }: MonthlyGrowthWidgetProps) {
  const [data, setData] = useState<MonthlyGrowthData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/statistics/monthly-growth?period=${period}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Error al cargar datos')
        }
      } catch {
        setError('Error al cargar datos de crecimiento mensual')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  const visibleMetrics = metrics.filter((metric) => metric in metricConfig)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Crecimiento Mensual
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4 mr-1" />
          Últimos {period} meses
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 24, right: 32, bottom: 16, left: 8 }}>
            <CartesianGrid stroke="currentColor" strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" />
            <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 11 }} width={44} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-light)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 8,
                color: 'var(--color-primary)',
                fontSize: 12,
              }}
            />
            <Legend />
            {visibleMetrics.map((metric) => (
              <Line
                key={metric}
                dataKey={metric}
                dot={{ r: 3 }}
                name={metricConfig[metric].label}
                stroke={metricConfig[metric].color}
                strokeWidth={2}
                type="monotone"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
