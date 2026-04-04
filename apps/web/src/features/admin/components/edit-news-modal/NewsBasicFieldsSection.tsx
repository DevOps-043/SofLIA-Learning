'use client'

import { ImageUpload } from '../ImageUpload'
import type { EditNewsFormData, NewsStatus } from './news-form.utils'
import { isNewsStatus } from './news-form.utils'

interface NewsBasicFieldsSectionProps {
  formData: EditNewsFormData
  isSubmitting: boolean
  onTitleChange: (title: string) => void
  onFieldChange: (field: keyof EditNewsFormData, value: string | NewsStatus) => void
}

export function NewsBasicFieldsSection({
  formData,
  isSubmitting,
  onTitleChange,
  onFieldChange,
}: NewsBasicFieldsSectionProps) {
  const inputClass =
    'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={e => onTitleChange(e.target.value)}
            className={inputClass}
            placeholder="Título de la noticia"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Slug *
          </label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={e => onFieldChange('slug', e.target.value)}
            className={inputClass}
            placeholder="url-amigable"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Introducción
        </label>
        <textarea
          value={formData.intro}
          onChange={e => onFieldChange('intro', e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Breve introducción de la noticia"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Imagen Hero
          </label>
          <ImageUpload
            value={formData.hero_image_url}
            onChange={url => onFieldChange('hero_image_url', url)}
            bucket="news"
            folder="hero-images"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Idioma
          </label>
          <select
            value={formData.language}
            onChange={e => onFieldChange('language', e.target.value)}
            className={inputClass}
          >
            <option value="es">Español</option>
            <option value="en">Inglés</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <select
            value={formData.status}
            onChange={e =>
              onFieldChange('status', isNewsStatus(e.target.value) ? e.target.value : 'draft')
            }
            className={inputClass}
          >
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="archived">Archivada</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Resumen TLDR
        </label>
        <textarea
          value={formData.tldrSummary}
          onChange={e => onFieldChange('tldrSummary', e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Resumen breve de la noticia en pocas palabras"
        />
      </div>
    </>
  )
}
