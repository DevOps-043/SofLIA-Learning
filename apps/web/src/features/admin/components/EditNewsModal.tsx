'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AdminNews } from '../services/adminNews.service'
import { ImageUpload } from './ImageUpload'

interface EditNewsModalProps {
  isOpen: boolean
  onClose: () => void
  news: AdminNews
  onSave: (newsData: Partial<AdminNews>) => Promise<void>
}

export function EditNewsModal({ isOpen, onClose, news, onSave }: EditNewsModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    subtitle: '',
    language: 'es',
    hero_image_url: '',
    intro: '',
    status: 'draft',
    created_by: crypto.randomUUID(),
    // Campos separados para JSON
    tldrSummary: '',
    links: [{ title: '', url: '' }], // Array de enlaces
    ctaText: '',
    ctaUrl: '',
    // Métricas como array de objetos
    metrics: [{ name: '', value: '', unit: '' }],
    // Secciones como array de objetos
    sections: [{ type: 'text', content: '', items: [] }]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Funciones para manejar múltiples enlaces
  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { title: '', url: '' }]
    }))
  }

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }))
  }

  const updateLink = (index: number, field: 'title' | 'url', value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  // Funciones para manejar métricas
  const addMetric = () => {
    setFormData(prev => ({
      ...prev,
      metrics: [...prev.metrics, { name: '', value: '', unit: '' }]
    }))
  }

  const removeMetric = (index: number) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index)
    }))
  }

  const updateMetric = (index: number, field: 'name' | 'value' | 'unit', value: string) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((metric, i) => 
        i === index ? { ...metric, [field]: value } : metric
      )
    }))
  }

  // Funciones para manejar secciones
  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { type: 'text', content: '', items: [] }]
    }))
  }

  const removeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }))
  }

  const updateSection = (index: number, field: 'type' | 'content', value: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }))
  }

  const addSectionItem = (sectionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, items: [...section.items, ''] }
          : section
      )
    }))
  }

  const removeSectionItem = (sectionIndex: number, itemIndex: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { ...section, items: section.items.filter((_, j) => j !== itemIndex) }
          : section
      )
    }))
  }

  const updateSectionItem = (sectionIndex: number, itemIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === sectionIndex 
          ? { 
              ...section, 
              items: section.items.map((item, j) => 
                j === itemIndex ? value : item
              )
            }
          : section
      )
    }))
  }

  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title || '',
        slug: news.slug || '',
        subtitle: news.subtitle || '',
        language: news.language || 'es',
        hero_image_url: news.hero_image_url || '',
        intro: news.intro || '',
        status: news.status || 'draft',
        created_by: news.created_by || crypto.randomUUID(),
        // Extraer datos de campos JSON
        tldrSummary: Array.isArray(news.tldr) && news.tldr.length > 0 
          ? news.tldr[0] 
          : (news.tldr?.summary || ''),
        links: news.links?.external && news.links.external.length > 0 
          ? news.links.external 
          : [{ title: '', url: '' }],
        ctaText: news.cta?.text || news.cta?.label || '',
        ctaUrl: news.cta?.url || '',
        metrics: news.metrics ? Object.values(news.metrics).map((metric: any) => ({
          name: metric.name || '',
          value: metric.value || '',
          unit: metric.unit || ''
        })) : [{ name: '', value: '', unit: '' }],
        sections: Array.isArray(news.sections) && news.sections.length > 0 
          ? news.sections.map((section: any) => ({
              type: section.kind || section.type || 'text',
              content: section.content || '',
              items: section.items || []
            }))
          : [{ type: 'text', content: '', items: [] }]
      })
    }
  }, [news])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convertir campos separados a JSON
      const newsData = {
        title: formData.title,
        slug: formData.slug,
        subtitle: formData.subtitle,
        language: formData.language,
        hero_image_url: formData.hero_image_url,
        intro: formData.intro,
        status: formData.status,
        created_by: formData.created_by,
        // Convertir campos separados a JSON
        tldr: formData.tldrSummary ? [formData.tldrSummary] : null,
        links: formData.links.filter(link => link.title && link.url).length > 0 ? {
          external: formData.links.filter(link => link.title && link.url)
        } : null,
        cta: (formData.ctaText && formData.ctaUrl) ? {
          text: formData.ctaText,
          label: formData.ctaText,
          url: formData.ctaUrl
        } : null,
        metrics: formData.metrics.filter(metric => metric.name && metric.value).length > 0 ? 
          formData.metrics.reduce((acc, metric, index) => {
            if (metric.name && metric.value) {
              acc[index] = {
                name: metric.name,
                value: metric.value,
                unit: metric.unit || ''
              }
            }
            return acc
          }, {} as any) : null,
        sections: formData.sections.filter(section => section.content || section.items.length > 0).length > 0 ?
          formData.sections.filter(section => section.content || section.items.length > 0).map(section => ({
            kind: section.type,
            content: section.content,
            items: section.items.filter(item => item.trim() !== '')
          })) : null
      }


      await onSave(newsData)
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }


  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Noticia</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onChange={(e) => setFormData(prev => ({ ...prev, intro: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Breve introducción de la noticia"
            />
          </div>

          {/* Secciones */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Secciones del Contenido</h4>
              <button
                type="button"
                onClick={addSection}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                + Agregar Sección
              </button>
            </div>
            
            {formData.sections.map((section, index) => (
              <div key={index} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Sección
                    </label>
                    <select
                      value={section.type}
                      onChange={(e) => updateSection(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      onClick={() => removeSection(index)}
                      disabled={formData.sections.length === 1}
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
                    onChange={(e) => updateSection(index, 'content', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Escribe el contenido principal de esta sección..."
                  />
                </div>

                {(section.type === 'steps' || section.type === 'list' || section.type === 'tools' || section.type === 'examples') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {section.type === 'steps' ? 'Pasos' : 
                         section.type === 'list' ? 'Elementos de la Lista' :
                         section.type === 'tools' ? 'Herramientas' : 'Ejemplos'}
                      </label>
                      <button
                        type="button"
                        onClick={() => addSectionItem(index)}
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
                          onChange={(e) => updateSectionItem(index, itemIndex, e.target.value)}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`${section.type === 'steps' ? 'Paso' : 'Elemento'} ${itemIndex + 1}...`}
                        />
                        <button
                          type="button"
                          onClick={() => removeSectionItem(index, itemIndex)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagen Hero
              </label>
              <ImageUpload
                value={formData.hero_image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, hero_image_url: url }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicada</option>
                <option value="archived">Archivada</option>
              </select>
            </div>

          </div>

          {/* Resumen TLDR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resumen TLDR
            </label>
            <textarea
              value={formData.tldrSummary}
              onChange={(e) => setFormData(prev => ({ ...prev, tldrSummary: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Resumen breve de la noticia en pocas palabras"
            />
          </div>

          {/* Enlaces */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Enlaces</h4>
              <button
                type="button"
                onClick={addLink}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                + Agregar Enlace
              </button>
            </div>
            
            {formData.links.map((link, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título del Enlace
                  </label>
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://ejemplo.com"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    disabled={formData.links.length === 1}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Call to Action</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Texto del Botón
                </label>
                <input
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Leer más"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL del Botón
                </label>
                <input
                  type="url"
                  value={formData.ctaUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctaUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://ejemplo.com/leer-mas"
                />
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Métricas</h4>
              <button
                type="button"
                onClick={addMetric}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                + Agregar Métrica
              </button>
            </div>
            
            {formData.metrics.map((metric, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Métrica
                  </label>
                  <input
                    type="text"
                    value={metric.name}
                    onChange={(e) => updateMetric(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={(e) => updateMetric(index, 'value', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: %, views, etc."
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeMetric(index)}
                    disabled={formData.metrics.length === 1}
                    className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
