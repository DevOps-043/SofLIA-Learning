import type { FaqItem, FeatureCard, HeroContent, Testimonial } from './common'

export interface Instructor {
  id: string
  name: string
  role: string
  bio: string
  avatar?: string
  rating: number
  students: number
  courses: number
  expertise: string[]
}

export interface PricingTier {
  id: string
  name: string
  description: string
  price: string
  period: string
  features: string[]
  isPopular?: boolean
  ctaText: string
}

export interface ComparisonFeature {
  name: string
  description?: string
  team: boolean
  business: boolean
  enterprise: boolean
  notes?: string
}

export interface ComparisonCategory {
  name: string
  features: ComparisonFeature[]
}

export interface BusinessPageContent {
  hero: HeroContent
  benefits: TitledCardsSection
  instructors: {
    title: string
    subtitle: string
    items: Instructor[]
  }
  companies: CompaniesContent
  instructorsInfo: InstructorsInfoContent
  cta: CtaContent
}

interface TitledCardsSection {
  title: string
  subtitle: string
  cards: FeatureCard[]
}

interface CompaniesContent extends TitledCardsSection {
  pricing: { title: string; subtitle: string; tiers: PricingTier[] }
  comparison: {
    title: string
    subtitle: string
    categories: ComparisonCategory[]
  }
  faq: { title: string; subtitle: string; items: FaqItem[] }
  testimonials: Testimonial[]
}

interface InstructorsInfoContent extends TitledCardsSection {
  benefits: string[]
  process: {
    title: string
    steps: Array<{ id: string; title: string; description: string }>
  }
  faq: { title: string; subtitle: string; items: FaqItem[] }
  testimonials: Testimonial[]
}

interface CtaContent {
  title: string
  subtitle: string
  buttonText: string
}
