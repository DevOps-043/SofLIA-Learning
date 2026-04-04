'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import type { AdminNews } from '../../services/adminNews.service'
import { useNewsFormState } from './useNewsFormState'
import { NewsBasicFieldsSection } from './NewsBasicFieldsSection'
import { NewsSectionsBuilder } from './NewsSectionsBuilder'
import { NewsLinksSection } from './NewsLinksSection'
import { NewsMetricsSection } from './NewsMetricsSection'
import type { EditNewsFormData, NewsStatus } from './news-form.utils'

interface EditNewsModalProps {
  isOpen: boolean
  onClose: () => void
  news: AdminNews
  onSave: (newsData: Partial<AdminNews>) => Promise<void>
}

export function EditNewsModal({ isOpen, onClose, news, onSave }: EditNewsModalProps) {
  const {
    formData,
    setFormData,
    isSubmitting,
    handleTitleChange,
    handleSubmit,
    addLink,
    removeLink,
    updateLink,
    addMetric,
    removeMetric,
    updateMetric,
    addSection,
    removeSection,
    updateSection,
    addSectionItem,
    removeSectionItem,
    updateSectionItem,
  } = useNewsFormState(news, onSave)

  if (!isOpen) return null

  const handleFieldChange = (field: keyof EditNewsFormData, value: string | NewsStatus) =>
    setFormData(prev => ({ ...prev, [field]: value }))

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
          <NewsBasicFieldsSection
            formData={formData}
            isSubmitting={isSubmitting}
            onTitleChange={handleTitleChange}
            onFieldChange={handleFieldChange}
          />

          <NewsSectionsBuilder
            sections={formData.sections}
            onAdd={addSection}
            onRemove={removeSection}
            onUpdate={updateSection}
            onAddItem={addSectionItem}
            onRemoveItem={removeSectionItem}
            onUpdateItem={updateSectionItem}
          />

          <NewsLinksSection
            links={formData.links}
            ctaText={formData.ctaText}
            ctaUrl={formData.ctaUrl}
            onAddLink={addLink}
            onRemoveLink={removeLink}
            onUpdateLink={updateLink}
            onFieldChange={handleFieldChange}
          />

          <NewsMetricsSection
            metrics={formData.metrics}
            onAdd={addMetric}
            onRemove={removeMetric}
            onUpdate={updateMetric}
          />

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
