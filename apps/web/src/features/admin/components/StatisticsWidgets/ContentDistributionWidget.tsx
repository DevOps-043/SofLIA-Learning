'use client'

import { useEffect, useState } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface ContentDistribution {
  category: string
  count: number
  percentage: number
  color: string
}

export function ContentDistributionWidget() {
  const [data, setData] = useState<ContentDistribution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/admin/statistics/content-distribution')
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Error al cargar datos')
        }
      } catch {
        setError('Error al cargar distribución de contenido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Distribución de Contenido
        </h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <ChartBarIcon className="h-4 w-4 mr-1" />
          Por categoría
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 24, right: 24, bottom: 24, left: 24 }}>
            <Pie
              cx="50%"
              cy="50%"
              data={data}
              dataKey="percentage"
              innerRadius="50%"
              label={({ name, value }) => `${name} ${value}%`}
              labelLine={false}
              nameKey="category"
              outerRadius="80%"
              paddingAngle={2}
            >
              {data.map((item) => (
                <Cell key={item.category} fill={item.color} stroke="var(--color-bg-light)" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-light)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 8,
                color: 'var(--color-primary)',
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value}%`, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div key={item.category} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-3"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.count}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
