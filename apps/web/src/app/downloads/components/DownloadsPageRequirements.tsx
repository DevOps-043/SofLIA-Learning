'use client'

import { Apple, Monitor, ShieldCheck, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function DownloadsPageRequirements() {
  const { t } = useTranslation('common')

  const requirementsList = [
    {
      os: 'Windows',
      min: 'Windows 10+ (64-bit)',
      ram: t('downloadsPage.requirements.ramRecomended'),
      disk: '~300 MB',
      icon: Monitor,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      os: 'macOS',
      min: 'macOS 12 Monterey+',
      ram: t('downloadsPage.requirements.ramRecomended'),
      disk: '~300 MB',
      icon: Apple,
      color: 'bg-gray-500/10 text-gray-400',
    },
    {
      os: 'Linux',
      min: 'Ubuntu 20.04+ / Debian 11+ (64-bit)',
      ram: t('downloadsPage.requirements.ramRecomended'),
      disk: '~300 MB',
      icon: Terminal,
      color: 'bg-amber-500/10 text-amber-500',
    },
  ]

  return (
    <section className="bg-white dark:bg-white/5 rounded-[40px] border border-black/5 dark:border-white/10 p-8 lg:p-12 shadow-2xl shadow-black/5 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
        <ShieldCheck size={200} />
      </div>

      <div className="relative z-10 mb-12">
        <h2 className="text-3xl font-bold dark:text-white mb-4">
          {t('downloadsPage.requirements.title')}
        </h2>
        <p className="text-primary/60 dark:text-white/60">
          {t('downloadsPage.requirements.subtitle')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">
                {t('downloadsPage.requirements.platform')}
              </th>
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">
                {t('downloadsPage.requirements.os')}
              </th>
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40 pr-8">
                {t('downloadsPage.requirements.ram')}
              </th>
              <th className="py-4 font-bold text-sm uppercase tracking-wider dark:text-white/40">
                {t('downloadsPage.requirements.disk')}
              </th>
            </tr>
          </thead>
          <tbody>
            {requirementsList.map((requirement) => (
              <tr
                key={requirement.os}
                className="border-b border-black/5 dark:border-white/5 last:border-0 group"
              >
                <td className="py-6 pr-8">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${requirement.color} flex items-center justify-center`}
                    >
                      <requirement.icon size={20} />
                    </div>
                    <span className="font-bold dark:text-white">
                      {requirement.os}
                    </span>
                  </div>
                </td>
                <td className="py-6 pr-8 text-primary/60 dark:text-white/60">
                  {requirement.min}
                </td>
                <td className="py-6 pr-8 text-primary/60 dark:text-white/60">
                  {requirement.ram}
                </td>
                <td className="py-6 text-primary/60 dark:text-white/60">
                  {requirement.disk}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
