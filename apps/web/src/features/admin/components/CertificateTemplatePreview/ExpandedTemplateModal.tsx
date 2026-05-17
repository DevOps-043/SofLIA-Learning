import { ArrowLeft, X } from 'lucide-react'
import { CertificateDocument } from './CertificateDocument'
import type { CertificatePreviewData, CertificateTemplate } from './types'

interface ExpandedTemplateModalProps {
  data: CertificatePreviewData
  isSelected: boolean
  onBack: () => void
  onSelect: () => void
  template: CertificateTemplate
}

export function ExpandedTemplateModal({
  data,
  isSelected,
  onBack,
  onSelect,
  template,
}: ExpandedTemplateModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[98vh] flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{template.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSelect} className={`px-4 py-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {isSelected ? '✓ Seleccionada' : 'Seleccionar'}
            </button>
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-auto flex-1 flex items-start justify-center">
          <div className="w-full" style={{ maxWidth: '816px', width: '100%' }}>
            <CertificateDocument data={data} isExpanded template={template} />
          </div>
        </div>
      </div>
    </div>
  )
}
