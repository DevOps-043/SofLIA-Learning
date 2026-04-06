'use client'

import { useState } from 'react'
import { AdminNews } from '../../services/adminNews.service'

type NewsStatus = 'draft' | 'published' | 'archived'

const isNewsStatus = (value: string): value is NewsStatus => (
  value === 'draft' || value === 'published' || value === 'archived'
)

const INITIAL_FORM = {
  title: '',
  slug: '',
  subtitle: '',
  language: 'es',
  hero_image_url: '',
  intro: '',
  status: 'draft' as string,
  created_by: crypto.randomUUID(),
  tldrSummary: '',
  links: [{ title: '', url: '' }],
  ctaText: '',
  ctaUrl: '',
  metrics: [{ name: '', value: '', unit: '' }],
  sections: [{ type: 'text', content: '', items: [] as string[] }]
}

type FormData = typeof INITIAL_FORM

interface UseAddNewsFormStateProps {
  onSave: (newsData: Partial<AdminNews>) => Promise<void>
  onClose: () => void
}

export function useAddNewsFormState({ onSave, onClose }: UseAddNewsFormStateProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({ ...prev, title, slug: generateSlug(title) }))
  }

  // Links handlers
  const addLink = () => setFormData(prev => ({ ...prev, links: [...prev.links, { title: '', url: '' }] }))
  const removeLink = (index: number) => setFormData(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }))
  const updateLink = (index: number, field: 'title' | 'url', value: string) =>
    setFormData(prev => ({ ...prev, links: prev.links.map((link, i) => i === index ? { ...link, [field]: value } : link) }))

  // Metrics handlers
  const addMetric = () => setFormData(prev => ({ ...prev, metrics: [...prev.metrics, { name: '', value: '', unit: '' }] }))
  const removeMetric = (index: number) => setFormData(prev => ({ ...prev, metrics: prev.metrics.filter((_, i) => i !== index) }))
  const updateMetric = (index: number, field: 'name' | 'value' | 'unit', value: string) =>
    setFormData(prev => ({ ...prev, metrics: prev.metrics.map((metric, i) => i === index ? { ...metric, [field]: value } : metric) }))

  // Sections handlers
  const addSection = () => setFormData(prev => ({ ...prev, sections: [...prev.sections, { type: 'text', content: '', items: [] }] }))
  const removeSection = (index: number) => setFormData(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }))
  const updateSection = (index: number, field: 'type' | 'content', value: string) =>
    setFormData(prev => ({ ...prev, sections: prev.sections.map((section, i) => i === index ? { ...section, [field]: value } : section) }))
  const addSectionItem = (sectionIndex: number) =>
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex ? { ...section, items: [...section.items, ''] } : section
      )
    }))
  const removeSectionItem = (sectionIndex: number, itemIndex: number) =>
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex ? { ...section, items: section.items.filter((_, j) => j !== itemIndex) } : section
      )
    }))
  const updateSectionItem = (sectionIndex: number, itemIndex: number, value: string) =>
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, items: section.items.map((item, j) => j === itemIndex ? value : item) }
          : section
      )
    }))

  const buildNewsData = (): Partial<AdminNews> => ({
    title: formData.title,
    slug: formData.slug,
    subtitle: formData.subtitle,
    language: formData.language,
    hero_image_url: formData.hero_image_url,
    intro: formData.intro,
    status: formData.status,
    created_by: formData.created_by,
    tldr: formData.tldrSummary ? [formData.tldrSummary] : null,
    links: formData.links.filter(link => link.title && link.url).length > 0
      ? { external: formData.links.filter(link => link.title && link.url) }
      : null,
    cta: (formData.ctaText && formData.ctaUrl)
      ? { text: formData.ctaText, label: formData.ctaText, url: formData.ctaUrl }
      : null,
    metrics: formData.metrics.filter(metric => metric.name && metric.value).length > 0
      ? formData.metrics.reduce<Record<number, { name: string; value: string; unit: string }>>((acc, metric, index) => {
          if (metric.name && metric.value) acc[index] = { name: metric.name, value: metric.value, unit: metric.unit || '' }
          return acc
        }, {})
      : null,
    sections: formData.sections.filter(section => section.content || section.items.length > 0).length > 0
      ? formData.sections
          .filter(section => section.content || section.items.length > 0)
          .map(section => ({
            kind: section.type,
            content: section.content,
            items: section.items.filter(item => item.trim() !== '')
          }))
      : null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(buildNewsData())
      setFormData({
        ...INITIAL_FORM,
        created_by: crypto.randomUUID()
      })
    } catch (error) {
      // error handled silently as in original
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    setFormData,
    isSubmitting,
    isNewsStatus,
    handleTitleChange,
    addLink, removeLink, updateLink,
    addMetric, removeMetric, updateMetric,
    addSection, removeSection, updateSection,
    addSectionItem, removeSectionItem, updateSectionItem,
    handleSubmit
  }
}
