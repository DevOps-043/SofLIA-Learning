export interface FeatureCard {
  id: string
  icon: string
  title: string
  description: string
}

export interface Statistic {
  value: string
  label: string
}

export interface Testimonial {
  id: string
  quote: string
  author: string
  role: string
  avatar?: string
}

export interface HeroContent {
  tag: string
  title: string
  highlightWord: string
  description: string
  ctaText: string
  benefits: string[]
}

export interface FaqItem {
  question: string
  answer: string
}
