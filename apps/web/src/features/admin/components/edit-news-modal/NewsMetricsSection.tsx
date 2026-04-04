'use client'

import type { NewsMetricItem } from './news-form.utils'

interface NewsMetricsSectionProps {
  metrics: NewsMetricItem[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: 'name' | 'value' | 'unit', value: string) => void
}

const inputClass =
  'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export function NewsMetricsSection({ metrics, onAdd, onRemove, onUpdate }: NewsMetricsSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Métricas</h4>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          + Agregar Métrica
        </button>
      </div>

      {metrics.map((metric, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Métrica
            </label>
            <input
              type="text"
              value={metric.name}
              onChange={e => onUpdate(index, 'name', e.target.value)}
              className={inputClass}
              placeholder="Ej: Vistas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valor
            </label>
            <input
              type="text"
              value={metric.value}
              onChange={e => onUpdate(index, 'value', e.target.value)}
              className={inputClass}
              placeholder="Ej: 1250"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unidad
            </label>
            <input
              type="text"
              value={metric.unit}
              onChange={e => onUpdate(index, 'unit', e.target.value)}
              className={inputClass}
              placeholder="Ej: %, views, etc."
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={metrics.length === 1}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
