'use client'

import { Apple, Check, Clock, Download, Monitor, Terminal } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '@/features/landing/components/home/SectionHeading'
import { SpotlightCard } from '@/features/landing/components/home/react-bits/SpotlightCard'
import homeStyles from '@/features/landing/components/home/SofliaHome.module.css'
import type { ReleaseData } from '../../types'
import type { HubPlatform } from './usePlatformDetection'
import styles from './pulse-hub.module.css'

const PLATFORMS: Array<{ id: HubPlatform; icon: typeof Monitor }> = [
  { id: 'windows', icon: Monitor },
  { id: 'mac', icon: Apple },
  { id: 'linux', icon: Terminal },
]

interface PulseHubPlatformsProps {
  release: ReleaseData | null
  detectedPlatform: HubPlatform | null
}

export function PulseHubPlatforms({ release, detectedPlatform }: PulseHubPlatformsProps) {
  const { t } = useTranslation('hub')

  return (
    <section
      id="plataformas"
      className={`${homeStyles.section} ${homeStyles.shell}`}
      aria-labelledby="hub-platforms-title"
    >
      <SectionHeading
        eyebrow={t('platforms.eyebrow')}
        title={t('platforms.title')}
        description={t('platforms.description')}
      />

      <div className={styles.platformsGrid}>
        {PLATFORMS.map(({ id, icon: Icon }, index) => {
          const asset = release?.assets[id]
          const isDetected = id === detectedPlatform

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
            >
              <SpotlightCard
                className={`${styles.platformCard} ${
                  isDetected ? styles.platformCardDetected : ''
                }`}
              >
                <header className={styles.platformHeader}>
                  <span className={styles.platformIcon}>
                    <Icon size={21} aria-hidden="true" />
                  </span>
                  {isDetected ? (
                    <span className={styles.platformDetectedBadge}>
                      <Check size={12} aria-hidden="true" />
                      {t('platforms.recommended')}
                    </span>
                  ) : null}
                </header>

                <h3>{t(`platforms.items.${id}.name`)}</h3>

                <ul className={styles.platformSpecs}>
                  <li>
                    <Check size={14} aria-hidden="true" />
                    {t(`platforms.items.${id}.compat`)}
                  </li>
                  <li>
                    <Check size={14} aria-hidden="true" />
                    {t('platforms.ram')}
                  </li>
                  <li>
                    <Check size={14} aria-hidden="true" />
                    {t('platforms.disk')}
                  </li>
                </ul>

                <div className={styles.platformFooter}>
                  {asset ? (
                    <>
                      <span className={styles.platformSize}>
                        {t('platforms.sizeLabel')}: {asset.size}
                      </span>
                      <a href={asset.url} className={homeStyles.primaryButton} download>
                        <Download size={16} aria-hidden="true" />
                        {t('platforms.download')}
                      </a>
                    </>
                  ) : (
                    <>
                      <span className={styles.platformComingSoon}>
                        <Clock size={15} aria-hidden="true" />
                        {t('platforms.comingSoon')}
                      </span>
                      <p className={styles.platformComingSoonNote}>
                        {t('platforms.comingSoonNote')}
                      </p>
                    </>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
