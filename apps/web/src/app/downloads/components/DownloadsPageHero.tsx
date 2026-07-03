'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Apple, Download, Monitor, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReleaseData } from '../types'

interface DownloadsPageHeroProps {
  release: ReleaseData | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function DownloadsPageHero({
  release,
  loading,
  error,
  onRetry,
}: DownloadsPageHeroProps) {
  const { t } = useTranslation('common')

  return (
    <section className="text-center mb-20 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 mb-6">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-primary/60 dark:text-white/60">
            {loading
              ? t('downloadsPage.hero.loading')
              : error
                ? t('downloadsPage.hero.error')
                : t('downloadsPage.hero.versionAvailable', { version: release?.version })}
          </span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-bold text-primary dark:text-white mb-6 tracking-tight">
          {t('downloadsPage.hero.title').split('SofLIA Hub')[0]}
          <span className="text-accent">SofLIA Hub</span>
          {t('downloadsPage.hero.title').split('SofLIA Hub')[1]}
        </h1>

        <p className="text-xl text-primary/60 dark:text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed">
          {t('downloadsPage.hero.description')}
        </p>
      </motion.div>

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
        >
          <AlertTriangle className="text-amber-500 shrink-0" size={20} />
          <p className="text-sm text-amber-700 dark:text-amber-400 text-left flex-1">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 text-sm font-medium transition-colors shrink-0"
          >
            {t('actions.retry')}
          </button>
        </motion.div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {loading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-64 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 animate-pulse"
            />
          ))
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="relative group overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-8 shadow-2xl shadow-black/5"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Monitor size={120} />
              </div>

              <div className="relative z-10 flex flex-col h-full text-left">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <Monitor className="text-blue-500" size={32} />
                </div>
                <h3 className="text-2xl font-bold dark:text-white mb-2">
                  Windows
                </h3>
                <p className="text-primary/40 dark:text-white/40 text-sm mb-8 flex-1">
                  {t('downloadsPage.hero.windowsCompat')}
                  {release?.assets.windows?.size ? (
                    <>
                      <br />
                      {t('downloadsPage.hero.size', { size: release.assets.windows.size })}
                    </>
                  ) : null}
                </p>

                {release?.assets.windows ? (
                  <a
                    href={release.assets.windows.url}
                    className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-primary hover:bg-primary dark:bg-accent dark:hover:bg-[var(--color-legacy-00b8a3)] text-white transition-all group"
                  >
                    <span className="font-bold">{t('downloadsPage.hero.downloadWindows')}</span>
                    <Download
                      size={20}
                      className="group-hover:translate-y-1 transition-transform"
                    />
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full px-6 py-4 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-500 cursor-not-allowed"
                  >
                    {t('downloadsPage.hero.notAvailable')}
                  </button>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="relative group overflow-hidden rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-8 shadow-2xl shadow-black/5"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Apple size={120} />
              </div>

              <div className="relative z-10 flex flex-col h-full text-left">
                <div className="w-14 h-14 rounded-2xl bg-gray-500/10 flex items-center justify-center mb-6">
                  <Apple className="text-gray-400" size={32} />
                </div>
                <h3 className="text-2xl font-bold dark:text-white mb-2">
                  macOS
                </h3>
                <p className="text-primary/40 dark:text-white/40 text-sm mb-8 flex-1">
                  {t('downloadsPage.hero.macCompat')}
                  {release?.assets.mac?.size ? (
                    <>
                      <br />
                      {t('downloadsPage.hero.size', { size: release.assets.mac.size })}
                    </>
                  ) : null}
                </p>

                <div className="w-full">
                  <button
                    disabled
                    className="flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed"
                  >
                    <span className="font-bold">{t('downloadsPage.hero.comingSoonMac')}</span>
                    <Apple size={20} className="opacity-40" />
                  </button>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-2 text-center">
                    {t('downloadsPage.hero.comingSoonMacDesc')}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}
