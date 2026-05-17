'use client'

import { useState } from 'react'
import { FeatureCard } from './FeatureCard'
import { platformFeatures } from './platform-features'

export function PlatformFeaturesGrid() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      {platformFeatures.map((feature, index) => (
        <FeatureCard
          feature={feature}
          index={index}
          isHovered={hoveredIndex === index}
          key={feature.id}
          onHoverEnd={() => setHoveredIndex(null)}
          onHoverStart={() => setHoveredIndex(index)}
        />
      ))}
    </div>
  )
}
