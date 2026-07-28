'use client'

import { useState } from 'react'
import { HomeFooter } from '@/features/landing/components/home/HomeFooter'
import { HomeHeader } from '@/features/landing/components/home/HomeHeader'
import { ClickSpark } from '@/features/landing/components/home/react-bits/ClickSpark'
import homeStyles from '@/features/landing/components/home/SofliaHome.module.css'
import {
  PulseHubChangelogModal,
  PulseHubFeatures,
  PulseHubHero,
  PulseHubPlatforms,
  PulseHubSteps,
  usePlatformDetection,
} from './components/hub'
import { useDownloadsPageData } from './hooks/useDownloadsPageData'

export function DownloadsPageClient() {
  const {
    release,
    changelogs,
    loading,
    error,
    expandedVersions,
    toggleVersion,
    refetchRelease,
  } = useDownloadsPageData()
  const detectedPlatform = usePlatformDetection()
  const [isChangelogOpen, setIsChangelogOpen] = useState(false)

  return (
    <main className={homeStyles.page}>
      <div className={homeStyles.noise} aria-hidden="true" />
      <ClickSpark>
        <HomeHeader />
        <PulseHubHero
          release={release}
          loading={loading}
          error={error}
          detectedPlatform={detectedPlatform}
          onRetry={refetchRelease}
          onOpenChangelog={() => setIsChangelogOpen(true)}
        />
        <PulseHubPlatforms release={release} detectedPlatform={detectedPlatform} />
        <PulseHubFeatures />
        <PulseHubSteps />
        <HomeFooter />
      </ClickSpark>
      <PulseHubChangelogModal
        isOpen={isChangelogOpen}
        changelogs={changelogs}
        expandedVersions={expandedVersions}
        onToggleVersion={toggleVersion}
        onClose={() => setIsChangelogOpen(false)}
      />
    </main>
  )
}
