'use client'

import { Github, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function DownloadsPageSafety() {
  const { t } = useTranslation('common')

  const safetyBadges = [
    {
      icon: ShieldCheck,
      label: t('downloadsPage.safety.badges.ssl'),
      accentClassName: 'text-accent',
    },
    {
      icon: ShieldCheck,
      label: t('downloadsPage.safety.badges.updates'),
      accentClassName: 'text-accent',
    },
    {
      icon: Github,
      label: t('downloadsPage.safety.badges.source'),
      accentClassName: 'text-white/80',
    },
  ]

  const PrimaryIcon = safetyBadges[0].icon

  return (
    <section className="mt-20 text-center py-12 px-6 rounded-[40px] bg-gradient-to-br from-primary to-[var(--color-legacy-173b63)] dark:from-[var(--color-legacy-1a2332)] dark:to-carbon-900 text-white">
      <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-8">
        <PrimaryIcon className="text-accent" size={32} />
      </div>
      <h2 className="text-3xl font-bold mb-4">
        {t('downloadsPage.safety.title')}
      </h2>
      <p className="max-w-2xl mx-auto text-white/70 mb-12">
        {t('downloadsPage.safety.description')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {safetyBadges.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md"
          >
            <badge.icon size={18} className={badge.accentClassName} />
            <span className="text-sm font-medium">{badge.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
