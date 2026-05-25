'use client'

import { motion } from 'framer-motion'
import type { PlatformFeature } from './types'

interface FeatureContentProps {
  feature: PlatformFeature
  index: number
  isEven: boolean
  isHovered: boolean
}

export function FeatureContent({
  feature,
  index,
  isEven,
  isHovered,
}: FeatureContentProps) {
  return (
    <motion.div
      animate={isHovered ? { x: isEven ? 10 : -10 } : { x: 0 }}
      className="flex-1 w-full lg:w-auto"
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        <motion.h3
          animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
          className="text-3xl lg:text-4xl xl:text-5xl font-bold"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, color: feature.color }}
          transition={{ duration: 0.3 }}
        >
          {feature.title}
        </motion.h3>
        <motion.p
          animate={isHovered ? { opacity: 1 } : { opacity: 0.8 }}
          className="text-lg lg:text-xl text-gray-500 dark:text-white/70 leading-relaxed"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          transition={{ duration: 0.3 }}
        >
          {feature.description}
        </motion.p>
        <motion.div
          className="h-1 bg-gray-200 dark:bg-gray-500/30 rounded-full overflow-hidden mt-6"
          initial={{ width: 0 }}
          transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
          viewport={{ once: true }}
          whileInView={{ width: '100%' }}
        >
          <motion.div
            className={`h-full bg-gradient-to-r ${feature.gradient}`}
            initial={{ width: 0 }}
            transition={{ delay: index * 0.2 + 0.7, duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ width: '100%' }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
