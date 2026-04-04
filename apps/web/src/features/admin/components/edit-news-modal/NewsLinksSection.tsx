'use client'

import type { NewsLinkItem, EditNewsFormData } from './news-form.utils'

interface NewsLinksSectionProps {
  links: NewsLinkItem[]
  ctaText: string
  ctaUrl: string
  onAddLink: () => void
  onRemoveLink: (i: number) => void
  onUpdateLink: (i: number, field: 'title' | 'url', value: string) => void
  onFieldChange: (field: keyof EditNewsFormData, value: string) => void
}

const inputClass =
  'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export function NewsLinksSection({
  links,
  ctaText,
  ctaUrl,
  onAddLink,
  onRemoveLink,
  onUpdateLink,
  onFieldChange,
}: NewsLinksSectionProps) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Enlaces</h4>
          <button
            type="button"
            onClick={onAddLink}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            + Agregar Enlace
          </button>
        </div>

        {links.map((link, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título del Enlace
              </label>
              <input
                type="text"
                value={link.title}
                onChange={e => onUpdateLink(index, 'title', e.target.value)}
                className={inputClass}
                placeholder="Ej: Más información"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL del Enlace
              </label>
              <input
                type="url"
                value={link.url}
                onChange={e => onUpdateLink(index, 'url', e.target.value)}
                className={inputClass}
                placeholder="https://ejemplo.com"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onRemoveLink(index)}
                disabled={links.length === 1}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Call to Action</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Texto del Botón
            </label>
            <input
              type="text"
              value={ctaText}
              onChange={e => onFieldChange('ctaText', e.target.value)}
              className={inputClass}
              placeholder="Ej: Leer más"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL del Botón
            </label>
            <input
              type="url"
              value={ctaUrl}
              onChange={e => onFieldChange('ctaUrl', e.target.value)}
              className={inputClass}
              placeholder="https://ejemplo.com/leer-mas"
            />
          </div>
        </div>
      </div>
    </>
  )
}
