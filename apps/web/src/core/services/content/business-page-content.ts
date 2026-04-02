import type { BusinessPageContent } from '@aprende-y-aplica/shared'
import { businessPageCompanies } from './business-page-companies'
import { businessPageInstructorsInfo } from './business-page-instructors-info'
import {
  businessPageBenefits,
  businessPageCta,
  businessPageHero,
  businessPageInstructors,
} from './business-page-marketing'

export const businessPageContent: BusinessPageContent = {
  hero: businessPageHero,
  benefits: businessPageBenefits,
  instructors: businessPageInstructors,
  companies: businessPageCompanies,
  instructorsInfo: businessPageInstructorsInfo,
  cta: businessPageCta,
}
