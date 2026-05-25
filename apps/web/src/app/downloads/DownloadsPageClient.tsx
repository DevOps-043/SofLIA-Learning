'use client'

import { LandingFooter } from '../../features/landing/components/LandingFooter'
import { LandingHeader } from '../../features/landing/components/LandingHeader'
import {
  DownloadsPageChangelog,
  DownloadsPageFeatures,
  DownloadsPageHero,
  DownloadsPageRequirements,
  DownloadsPageSafety,
  DownloadsPageSteps,
} from './components'
import { useDownloadsPageData } from './hooks/useDownloadsPageData'

export function DownloadsPageClient() {
  const {
    release,
    changelogs,
    loading,
    error,
    expandedSections,
    expandedVersions,
    toggleSection,
    toggleVersion,
    refetchRelease,
  } = useDownloadsPageData()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 overflow-x-hidden">
      <LandingHeader />

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <DownloadsPageHero
            release={release}
            loading={loading}
            error={error}
            onRetry={refetchRelease}
          />
          <DownloadsPageChangelog
            changelogs={changelogs}
            expandedSections={expandedSections}
            expandedVersions={expandedVersions}
            onToggleSection={toggleSection}
            onToggleVersion={toggleVersion}
            loading={loading}
          />
          <DownloadsPageFeatures />
          <DownloadsPageSteps />
          <DownloadsPageRequirements />
          <DownloadsPageSafety />
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
