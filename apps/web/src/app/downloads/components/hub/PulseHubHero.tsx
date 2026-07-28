'use client'

import { Download, History, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BlurText } from '@/features/landing/components/home/react-bits/BlurText'
import { Magnet } from '@/features/landing/components/home/react-bits/Magnet'
import { StarBorder } from '@/features/landing/components/home/react-bits/StarBorder'
import homeStyles from '@/features/landing/components/home/SofliaHome.module.css'
import type { ReleaseData } from '../../types'
import type { HubPlatform } from './usePlatformDetection'
import styles from './pulse-hub.module.css'

const HERO_TEXT_FROM = { filter: 'blur(3px)', opacity: 0.78, y: 12 }
const HERO_TEXT_TO = [
  { filter: 'blur(1px)', opacity: 0.94, y: 2 },
  { filter: 'blur(0px)', opacity: 1, y: 0 },
]

interface PulseHubHeroProps {
  release: ReleaseData | null
  loading: boolean
  error: string | null
  detectedPlatform: HubPlatform | null
  onRetry: () => void
  onOpenChangelog: () => void
}

export function PulseHubHero({
  release,
  loading,
  error,
  detectedPlatform,
  onRetry,
  onOpenChangelog,
}: PulseHubHeroProps) {
  const { t } = useTranslation('hub')

  const detectedAsset = detectedPlatform ? release?.assets[detectedPlatform] : undefined

  return (
    <section className={`${styles.hero} ${homeStyles.shell}`} aria-labelledby="hub-hero-title">
      <p className={homeStyles.eyebrow}>{t('hero.eyebrow')}</p>

      <h1 id="hub-hero-title" className={styles.heroTitle}>
        <BlurText
          text={t('hero.titleStart')}
          delay={45}
          stepDuration={0.28}
          animationFrom={HERO_TEXT_FROM}
          animationTo={HERO_TEXT_TO}
        />
        <BlurText
          text={t('hero.titleHighlight')}
          delay={40}
          stepDuration={0.28}
          animationFrom={HERO_TEXT_FROM}
          animationTo={HERO_TEXT_TO}
          className={styles.heroTitleAccent}
        />
      </h1>

      <p className={styles.heroDescription}>{t('hero.description')}</p>

      {loading ? (
        <span className={styles.heroState} role="status">
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          {t('state.loading')}
        </span>
      ) : null}

      {!loading && error ? (
        <span className={`${styles.heroState} ${styles.heroStateError}`} role="alert">
          {t('state.error')}
          <button type="button" className={styles.heroRetry} onClick={onRetry}>
            <RefreshCw size={13} aria-hidden="true" className="mr-1 inline" />
            {t('state.retry')}
          </button>
        </span>
      ) : null}

      {release ? (
        <StarBorder className={styles.heroBadge} speed="5s">
          {t('hero.versionBadge', { version: release.version })}
          <span className={styles.heroBadgeDate}>· {release.date}</span>
        </StarBorder>
      ) : null}

      <div className={styles.heroActions}>
        {detectedAsset && detectedPlatform ? (
          <Magnet strength={0.2}>
            <a href={detectedAsset.url} className={homeStyles.primaryButton} download>
              <Download size={17} aria-hidden="true" />
              {t('hero.downloadFor', {
                platform: t(`platforms.items.${detectedPlatform}.name`),
              })}
            </a>
          </Magnet>
        ) : (
          <Magnet strength={0.2}>
            <a href="#plataformas" className={homeStyles.primaryButton}>
              <Download size={17} aria-hidden="true" />
              {t('hero.goToPlatforms')}
            </a>
          </Magnet>
        )}
        <button
          type="button"
          className={homeStyles.secondaryButton}
          onClick={onOpenChangelog}
        >
          <History size={16} aria-hidden="true" />
          {t('hero.changelogCta')}
        </button>
      </div>

      <ul className={styles.safetyStrip}>
        <li>
          <ShieldCheck size={15} aria-hidden="true" />
          {t('safety.official')}
        </li>
        <li>
          <ShieldCheck size={15} aria-hidden="true" />
          {t('safety.source')}
        </li>
        <li>
          <ShieldCheck size={15} aria-hidden="true" />
          {t('safety.updates')}
        </li>
      </ul>
    </section>
  )
}
