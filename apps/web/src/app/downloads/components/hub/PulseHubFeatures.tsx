'use client'

import {
  BarChart3,
  Bot,
  Layers,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/features/landing/components/home/SectionHeading'
import { SpotlightCard } from '@/features/landing/components/home/react-bits/SpotlightCard'
import homeStyles from '@/features/landing/components/home/SofliaHome.module.css'
import styles from './pulse-hub.module.css'

interface HubFeature {
  title: string
  description: string
}

const FEATURE_ICONS = [Bot, Layers, MessageCircle, Search, BarChart3, Settings] as const

export function PulseHubFeatures() {
  const { t } = useTranslation('hub')
  const features = t('features.items', { returnObjects: true }) as HubFeature[]

  return (
    <section
      className={`${homeStyles.section} ${homeStyles.shell}`}
      aria-labelledby="hub-features-title"
    >
      <SectionHeading
        eyebrow={t('features.eyebrow')}
        title={t('features.title')}
        description={t('features.description')}
      />

      <div className={styles.featuresGrid}>
        {features.map((feature, index) => {
          const Icon = FEATURE_ICONS[index] ?? Sparkles
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                delay: (index % 3) * 0.09,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <SpotlightCard className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <Icon size={19} aria-hidden="true" />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </SpotlightCard>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
