import { X } from 'lucide-react'
import { TemplateCard } from './TemplateCard'
import type { CertificatePreviewData, CertificateTemplate } from './types'

interface TemplatePickerModalProps {
  data: CertificatePreviewData
  onClose: () => void
  onConfirm: () => void
  onExpand: (templateId: string) => void
  onSelectTemplate: (templateId: string) => void
  selectedTemplate: string
  templates: CertificateTemplate[]
  viewDetailsLabel: string
}

export function TemplatePickerModal({
  data,
  onClose,
  onConfirm,
  onExpand,
  onSelectTemplate,
  selectedTemplate,
  templates,
  viewDetailsLabel,
}: TemplatePickerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vista Previa de Plantillas de Certificados</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Selecciona la plantilla que más te guste para tu certificado</p>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto scrollbar-thin-dark flex-1">
          <div className="flex justify-center">
            <div className="max-w-2xl w-full">
              {templates.map((template) => (
                <TemplateCard key={template.id} data={data} isSelected={selectedTemplate === template.id} onExpand={() => onExpand(template.id)} onSelect={() => onSelectTemplate(template.id)} template={template} viewDetailsLabel={viewDetailsLabel} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">Cancelar</button>
          <button onClick={onConfirm} className="px-6 py-2.5 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg shadow-blue-500/20">Seleccionar Plantilla</button>
        </div>
      </div>
    </div>
  )
}
