'use client'

import { SectionWrapper } from './shared'
import { CustomizationBrandingCard } from './customization-section/CustomizationBrandingCard'
import { CustomizationBrandingToggleCard } from './customization-section/CustomizationBrandingToggleCard'
import { CustomizationPaletteCard } from './customization-section/CustomizationPaletteCard'
import { CustomizationPanelStylesCard } from './customization-section/CustomizationPanelStylesCard'
import { CustomizationTypographyCard } from './customization-section/CustomizationTypographyCard'
import type { CustomizationSectionProps } from './customization-section/types'

function CustomizationSection(props: CustomizationSectionProps) {
  return (
    <SectionWrapper>
      <CustomizationBrandingCard {...props} />
      <CustomizationBrandingToggleCard {...props} />
      <CustomizationPaletteCard {...props} />
      <CustomizationTypographyCard {...props} />
      <CustomizationPanelStylesCard />
    </SectionWrapper>
  )
}

export { CustomizationSection }

