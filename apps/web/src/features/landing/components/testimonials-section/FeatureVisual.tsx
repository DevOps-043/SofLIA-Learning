'use client'

import { motion } from 'framer-motion'
import { FeatureParticles } from './FeatureParticles'
import type { PlatformFeature } from './types'

interface FeatureVisualProps {
  feature: PlatformFeature
  isHovered: boolean
}

export function FeatureVisual({ feature, isHovered }: FeatureVisualProps) {
  const IconComponent = feature.icon

  return (
    <motion.div
      animate={
        isHovered ? { scale: 1.1, rotate: [0, 5, -5, 0] } : { scale: 1, rotate: 0 }
      }
      className="flex-1 w-full lg:w-auto"
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <motion.div
          animate={
            isHovered ? { scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] } : {}
          }
          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-2xl opacity-30`}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className={`relative w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center border-2 border-white/20 shadow-2xl backdrop-blur-sm`}>
          <IconComponent className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
        </div>
        <FeatureParticles color={feature.color} isVisible={isHovered} />
      </div>
    </motion.div>
  )
}
