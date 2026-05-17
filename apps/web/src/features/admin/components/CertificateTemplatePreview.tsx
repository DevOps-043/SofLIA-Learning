'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExpandedTemplateModal } from './CertificateTemplatePreview/ExpandedTemplateModal'
import { TemplatePickerModal } from './CertificateTemplatePreview/TemplatePickerModal'
import { certificateTemplates } from './CertificateTemplatePreview/templates'
import type { CertificateTemplatePreviewProps } from './CertificateTemplatePreview/types'

export function CertificateTemplatePreview({
  isOpen,
  onClose,
  selectedTemplate,
  onSelectTemplate,
  instructorSignatureUrl,
  instructorSignatureName,
  instructorDisplayName,
  certificateHash,
  studentName = '[Nombre del Estudiante]',
  courseName = '[Nombre del Curso]',
  issueDate = '[Fecha]',
}: CertificateTemplatePreviewProps) {
  const { t } = useTranslation('common')
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  const previewData = useMemo(
    () => ({
      instructorSignatureUrl,
      instructorSignatureName,
      instructorDisplayName,
      certificateHash,
      studentName,
      courseName,
      issueDate,
    }),
    [
      certificateHash,
      courseName,
      instructorDisplayName,
      instructorSignatureName,
      instructorSignatureUrl,
      issueDate,
      studentName,
    ],
  )

  if (!isOpen) return null

  const expanded = expandedTemplate
    ? certificateTemplates.find((template) => template.id === expandedTemplate)
    : null

  if (expanded) {
    return (
      <ExpandedTemplateModal
        data={previewData}
        isSelected={selectedTemplate === expanded.id}
        onBack={() => setExpandedTemplate(null)}
        onSelect={() => onSelectTemplate(expanded.id)}
        template={expanded}
      />
    )
  }

  return (
    <TemplatePickerModal
      data={previewData}
      onClose={onClose}
      onConfirm={() => {
        onSelectTemplate(selectedTemplate)
        onClose()
      }}
      onExpand={setExpandedTemplate}
      onSelectTemplate={onSelectTemplate}
      selectedTemplate={selectedTemplate}
      templates={certificateTemplates}
      viewDetailsLabel={t('actions.viewDetails')}
    />
  )
}
