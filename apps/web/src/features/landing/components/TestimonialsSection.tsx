'use client'

import { useRef } from 'react'
import { useScroll, useTransform } from 'framer-motion'
import { useMotionSafe } from '../../../lib/utils/motion'
import { TestimonialsBackground } from './testimonials-section/TestimonialsBackground'
import { PlatformFeaturesGrid } from './testimonials-section/PlatformFeaturesGrid'
import { TestimonialsHeader } from './testimonials-section/TestimonialsHeader'

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { disableHeavy } = useMotionSafe()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const y1 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, -150])
  const y2 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, 150])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.3])

  return (
    <section ref={sectionRef} className="py-32 relative bg-white dark:bg-[#0F1419]">
      <TestimonialsBackground
        disableHeavy={disableHeavy}
        opacity={opacity}
        y1={y1}
        y2={y2}
      />
      <div className="container mx-auto px-4 relative z-10">
        <TestimonialsHeader />
        <PlatformFeaturesGrid />
      </div>
    </section>
  )
}
