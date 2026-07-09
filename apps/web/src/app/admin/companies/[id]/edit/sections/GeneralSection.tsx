'use client'

import { SectionWrapper } from './shared'
import { GeneralBasicInfoCard } from './general-section/GeneralBasicInfoCard'
import { GeneralContactCard } from './general-section/GeneralContactCard'
import { GeneralDangerZoneCard } from './general-section/GeneralDangerZoneCard'
import { GeneralLimitsCard } from './general-section/GeneralLimitsCard'
import { GeneralSecurityCard } from './general-section/GeneralSecurityCard'
import type { GeneralSectionProps } from './general-section/types'

function GeneralSection(props: GeneralSectionProps) {
  return (
    <SectionWrapper>
      <GeneralBasicInfoCard {...props} />
      <GeneralContactCard {...props} />
      <GeneralLimitsCard {...props} />
      <GeneralSecurityCard {...props} />
      <GeneralDangerZoneCard onDeleteClick={props.onDeleteClick} />
    </SectionWrapper>
  )
}

export { GeneralSection }

