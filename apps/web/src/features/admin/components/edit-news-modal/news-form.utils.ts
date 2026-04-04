export type NewsStatus = 'draft' | 'published' | 'archived'
export type NewsSectionType = 'text' | 'steps' | 'list' | 'tools' | 'examples'

export interface NewsLinkItem {
  title: string
  url: string
}

export interface NewsMetricItem {
  name: string
  value: string
  unit: string
}

export interface NewsSectionItem {
  type: NewsSectionType
  content: string
  items: string[]
}

export interface EditNewsFormData {
  title: string
  slug: string
  subtitle: string
  language: string
  hero_image_url: string
  intro: string
  status: NewsStatus
  created_by: string
  tldrSummary: string
  links: NewsLinkItem[]
  ctaText: string
  ctaUrl: string
  metrics: NewsMetricItem[]
  sections: NewsSectionItem[]
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isNewsStatus = (value: string): value is NewsStatus =>
  value === 'draft' || value === 'published' || value === 'archived'

export const normalizeSectionType = (value: unknown): NewsSectionType => {
  if (value === 'steps' || value === 'list' || value === 'tools' || value === 'examples') {
    return value
  }
  return 'text'
}

export const getObjectValues = (value: unknown): unknown[] =>
  isRecord(value) ? Object.values(value) : []

export const normalizeMetric = (metric: unknown): NewsMetricItem => {
  if (!isRecord(metric)) return { name: '', value: '', unit: '' }
  return {
    name: typeof metric.name === 'string' ? metric.name : '',
    value: typeof metric.value === 'string' ? metric.value : '',
    unit: typeof metric.unit === 'string' ? metric.unit : '',
  }
}

export const normalizeSection = (section: unknown): NewsSectionItem => {
  if (!isRecord(section)) return { type: 'text', content: '', items: [] }
  return {
    type: normalizeSectionType(section.kind ?? section.type),
    content: typeof section.content === 'string' ? section.content : '',
    items: Array.isArray(section.items)
      ? section.items.filter((item): item is string => typeof item === 'string')
      : [],
  }
}

export const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
