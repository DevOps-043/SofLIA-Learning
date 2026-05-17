import { Check, Maximize2 } from 'lucide-react'
import { CertificateDocument } from './CertificateDocument'
import type { CertificatePreviewData, CertificateTemplate } from './types'

interface TemplateCardProps {
  data: CertificatePreviewData
  isSelected: boolean
  onExpand: () => void
  onSelect: () => void
  template: CertificateTemplate
  viewDetailsLabel: string
}

export function TemplateCard({
  data,
  isSelected,
  onExpand,
  onSelect,
  template,
  viewDetailsLabel,
}: TemplateCardProps) {
  return (
    <div className={`relative transition-all duration-200 ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''} cursor-pointer`} onClick={onSelect}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
        <CertificateDocument data={data} template={template} />
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {isSelected && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
              <button onClick={(event) => { event.stopPropagation(); onExpand() }} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors" title={viewDetailsLabel}>
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
