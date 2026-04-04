'use client'

import type { NewsSectionItem } from './news-form.utils'

interface NewsSectionsBuilderProps {
  sections: NewsSectionItem[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: 'type' | 'content', value: string) => void
  onAddItem: (si: number) => void
  onRemoveItem: (si: number, ii: number) => void
  onUpdateItem: (si: number, ii: number, value: string) => void
}

const inputClass =
  'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export function NewsSectionsBuilder({
  sections,
  onAdd,
  onRemove,
  onUpdate,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: NewsSectionsBuilderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Secciones del Contenido
        </h4>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          + Agregar Sección
        </button>
      </div>

      {sections.map((section, index) => (
        <div key={index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Sección
              </label>
              <select
                value={section.type}
                onChange={e => onUpdate(index, 'type', e.target.value)}
                className={inputClass}
              >
                <option value="text">Texto</option>
                <option value="steps">Pasos</option>
                <option value="list">Lista</option>
                <option value="tools">Herramientas</option>
                <option value="examples">Ejemplos</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={sections.length === 1}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                Eliminar Sección
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenido Principal
            </label>
            <textarea
              value={section.content}
              onChange={e => onUpdate(index, 'content', e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Escribe el contenido principal de esta sección..."
            />
          </div>

          {(section.type === 'steps' ||
            section.type === 'list' ||
            section.type === 'tools' ||
            section.type === 'examples') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {section.type === 'steps'
                    ? 'Pasos'
                    : section.type === 'list'
                    ? 'Elementos de la Lista'
                    : section.type === 'tools'
                    ? 'Herramientas'
                    : 'Ejemplos'}
                </label>
                <button
                  type="button"
                  onClick={() => onAddItem(index)}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                >
                  + Agregar
                </button>
              </div>

              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={e => onUpdateItem(index, itemIndex, e.target.value)}
                    className={inputClass}
                    placeholder={`${section.type === 'steps' ? 'Paso' : 'Elemento'} ${itemIndex + 1}...`}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index, itemIndex)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
