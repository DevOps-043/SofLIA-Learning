'use client'

import { useState, useEffect } from 'react'
import type { AdminNews } from '../../services/adminNews.service'
import {
  EditNewsFormData,
  NewsMetricItem,
  isNewsStatus,
  generateSlug,
  getObjectValues,
  normalizeMetric,
  normalizeSection,
} from './news-form.utils'

const DEFAULT_FORM: EditNewsFormData = {
  title: '',
  slug: '',
  subtitle: '',
  language: 'es',
  hero_image_url: '',
  intro: '',
  status: 'draft',
  created_by: '',
  tldrSummary: '',
  links: [{ title: '', url: '' }],
  ctaText: '',
  ctaUrl: '',
  metrics: [{ name: '', value: '', unit: '' }],
  sections: [{ type: 'text', content: '', items: [] }],
}

export function useNewsFormState(
  news: AdminNews,
  onSave: (data: Partial<AdminNews>) => Promise<void>
) {
  const [formData, setFormData] = useState<EditNewsFormData>({
    ...DEFAULT_FORM,
    created_by: crypto.randomUUID(),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title || '',
        slug: news.slug || '',
        subtitle: news.subtitle || '',
        language: news.language || 'es',
        hero_image_url: news.hero_image_url || '',
        intro: news.intro || '',
        status: isNewsStatus(news.status) ? news.status : 'draft',
        created_by: news.created_by || crypto.randomUUID(),
        tldrSummary:
          Array.isArray(news.tldr) && news.tldr.length > 0
            ? news.tldr[0]
            : (news.tldr?.summary || ''),
        links:
          news.links?.external && news.links.external.length > 0
            ? news.links.external
            : [{ title: '', url: '' }],
        ctaText: news.cta?.text || news.cta?.label || '',
        ctaUrl: news.cta?.url || '',
        metrics: news.metrics
          ? getObjectValues(news.metrics).map(normalizeMetric)
          : [{ name: '', value: '', unit: '' }],
        sections:
          Array.isArray(news.sections) && news.sections.length > 0
            ? news.sections.map(normalizeSection)
            : [{ type: 'text', content: '', items: [] }],
      })
    }
  }, [news])

  const handleTitleChange = (title: string) =>
    setFormData(prev => ({ ...prev, title, slug: generateSlug(title) }))

  // Links
  const addLink = () =>
    setFormData(prev => ({ ...prev, links: [...prev.links, { title: '', url: '' }] }))
  const removeLink = (i: number) =>
    setFormData(prev => ({ ...prev, links: prev.links.filter((_, idx) => idx !== i) }))
  const updateLink = (i: number, field: 'title' | 'url', value: string) =>
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
    }))

  // Metrics
  const addMetric = () =>
    setFormData(prev => ({ ...prev, metrics: [...prev.metrics, { name: '', value: '', unit: '' }] }))
  const removeMetric = (i: number) =>
    setFormData(prev => ({ ...prev, metrics: prev.metrics.filter((_, idx) => idx !== i) }))
  const updateMetric = (i: number, field: 'name' | 'value' | 'unit', value: string) =>
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    }))

  // Sections
  const addSection = () =>
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { type: 'text', content: '', items: [] }],
    }))
  const removeSection = (i: number) =>
    setFormData(prev => ({ ...prev, sections: prev.sections.filter((_, idx) => idx !== i) }))
  const updateSection = (i: number, field: 'type' | 'content', value: string) =>
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    }))
  const addSectionItem = (si: number) =>
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === si ? { ...s, items: [...s.items, ''] } : s)),
    }))
  const removeSectionItem = (si: number, ii: number) =>
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s
      ),
    }))
  const updateSectionItem = (si: number, ii: number, value: string) =>
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === si ? { ...s, items: s.items.map((item, j) => (j === ii ? value : item)) } : s
      ),
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const newsData = {
        title: formData.title,
        slug: formData.slug,
        subtitle: formData.subtitle,
        language: formData.language,
        hero_image_url: formData.hero_image_url,
        intro: formData.intro,
        status: formData.status,
        created_by: formData.created_by,
        tldr: formData.tldrSummary ? [formData.tldrSummary] : null,
        links:
          formData.links.filter(l => l.title && l.url).length > 0
            ? { external: formData.links.filter(l => l.title && l.url) }
            : null,
        cta:
          formData.ctaText && formData.ctaUrl
            ? { text: formData.ctaText, label: formData.ctaText, url: formData.ctaUrl }
            : null,
        metrics:
          formData.metrics.filter(m => m.name && m.value).length > 0
            ? formData.metrics.reduce<Record<number, NewsMetricItem>>((acc, m, idx) => {
                if (m.name && m.value) acc[idx] = { name: m.name, value: m.value, unit: m.unit || '' }
                return acc
              }, {})
            : null,
        sections:
          formData.sections.filter(s => s.content || s.items.length > 0).length > 0
            ? formData.sections
                .filter(s => s.content || s.items.length > 0)
                .map(s => ({
                  kind: s.type,
                  content: s.content,
                  items: s.items.filter(item => item.trim() !== ''),
                }))
            : null,
      }
      await onSave(newsData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
  }
}
