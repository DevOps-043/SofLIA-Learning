import type {
  FeatureCard,
  HeroContent,
  Statistic,
  Testimonial,
} from './common'

export interface LandingPageContent {
  hero: HeroContent
  features: {
    title: string
    subtitle: string
    cards: FeatureCard[]
  }
  statistics: Statistic[]
  testimonials: {
    title: string
    items: Testimonial[]
  }
  cta: {
    title: string
    subtitle: string
    buttonText: string
  }
}
