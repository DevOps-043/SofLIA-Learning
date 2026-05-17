import type { BusinessPageContent } from '@aprende-y-aplica/shared'

import { companyCards } from './business-page-companies/cards'
import { companyComparison } from './business-page-companies/comparison'
import { companyFaq } from './business-page-companies/faq'
import { companyPricing } from './business-page-companies/pricing'
import { companyTestimonials } from './business-page-companies/testimonials'

export const businessPageCompanies: BusinessPageContent['companies'] = {
  title: 'Para Empresas',
  subtitle: 'CapacitaciÃƒÂ³n IA escalable para toda tu organizaciÃƒÂ³n',
  cards: companyCards,
  pricing: companyPricing,
  comparison: companyComparison,
  testimonials: companyTestimonials,
  faq: companyFaq,
}
