'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FeatureContent } from './FeatureContent'
import { FeatureVisual } from './FeatureVisual'
import type { PlatformFeature } from './types'

interface FeatureCardProps {
  feature: PlatformFeature
  index: number
  isHovered: boolean
  onHoverEnd: () => void
  onHoverStart: () => void
}

export function FeatureCard({
  feature,
  index,
  isHovered,
  onHoverEnd,
  onHoverStart,
}: FeatureCardProps) {
  const isEven = index % 2 === 0

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 100, rotateX: -15 }}
      onHoverEnd={onHoverEnd}
      onHoverStart={onHoverStart}
      style={{ transformStyle: 'preserve-3d' }}
      transition={{ delay: index * 0.2, duration: 0.8, type: 'spring', stiffness: 100 }}
      viewport={{ once: true, amount: 0.2 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
    >
      <Link href={feature.link}>
        <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12 h-full`}>
          <FeatureVisual feature={feature} isHovered={isHovered} />
          <FeatureContent
            feature={feature}
            index={index}
            isEven={isEven}
            isHovered={isHovered}
          />
        </div>
      </Link>
      {index < 3 && (
        <motion.div
          className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-accent/30 to-transparent"
          initial={{ height: 0 }}
          transition={{ delay: index * 0.2 + 0.8, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ height: 64 }}
        />
      )}
    </motion.div>
  )
}
