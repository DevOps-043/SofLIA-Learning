import type { BusinessPageContent } from '@aprende-y-aplica/shared'

import { administrationComparison } from './comparison-admin'
import { analyticsComparison } from './comparison-analytics'
import { userExperienceComparison } from './comparison-experience'
import { integrationsComparison } from './comparison-integrations'
import { supportComparison } from './comparison-support'

type CompanyComparison = BusinessPageContent['companies']['comparison']

export const companyComparison: CompanyComparison = {
  title: 'ComparaciÃƒÂ³n de CaracterÃƒÂ­sticas',
  subtitle: 'Elige el plan que mejor se adapte a tus necesidades',
  categories: [
    administrationComparison,
    analyticsComparison,
    userExperienceComparison,
    integrationsComparison,
    supportComparison,
  ],
}
