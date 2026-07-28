'use client'

import { Download, ShieldCheck, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/features/landing/components/home/SectionHeading'
import homeStyles from '@/features/landing/components/home/SofliaHome.module.css'
import styles from './pulse-hub.module.css'

interface HubStep {
  title: string
  description: string
}

const STEP_ICONS = [Download, Zap, ShieldCheck] as const

export function PulseHubSteps() {
  const { t } = useTranslation('hub')
  const steps = t('steps.items', { returnObjects: true }) as HubStep[]

  return (
    <section
      className={`${homeStyles.section} ${homeStyles.shell}`}
      aria-labelledby="hub-steps-title"
    >
      <SectionHeading eyebrow={t('steps.eyebrow')} title={t('steps.title')} />

      <div className={styles.stepsTrack}>
        <motion.span
          className={styles.stepsLine}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          aria-hidden="true"
        />
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Download
          return (
            <motion.article
              key={step.title}
              className={styles.stepItem}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                delay: 0.25 + index * 0.18,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className={styles.stepNode}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}
