'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FileText } from 'lucide-react'
import { DOWNLOADS_CHANGELOG_SECTION_META } from '../constants'
import {
  formatMarkdownBold,
  parseReleaseNotes,
} from '../services/downloads-page.service'
import type { ReleaseChangelog } from '../types'

interface DownloadsPageChangelogProps {
  changelogs: ReleaseChangelog[]
  expandedSections: Record<string, boolean>
  expandedVersions: Record<string, boolean>
  onToggleSection: (version: string, key: string) => void
  onToggleVersion: (version: string) => void
  loading: boolean
}

export function DownloadsPageChangelog({
  changelogs,
  expandedSections,
  expandedVersions,
  onToggleSection,
  onToggleVersion,
  loading,
}: DownloadsPageChangelogProps) {
  if (loading || changelogs.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="mt-16 max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2540]/5 dark:bg-white/5 border border-[#0A2540]/10 dark:border-white/10 mb-4">
          <FileText className="w-4 h-4 text-[#00D4B3]" />
          <span className="text-sm font-medium text-[#0A2540]/60 dark:text-white/60">
            Changelog
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {changelogs.map((changelog, index) => {
          const { releaseTitle, sections } = parseReleaseNotes(changelog.notes)
          const isVersionExpanded =
            expandedVersions[changelog.version] ?? index === 0
          const totalItems = sections.reduce(
            (sum, section) => sum + section.items.length,
            0,
          )

          return (
            <div
              key={changelog.version}
              className="bg-white dark:bg-white/[0.03] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-sm shadow-black/5"
            >
              <button
                onClick={() => onToggleVersion(changelog.version)}
                className="w-full flex items-center justify-between p-6 md:p-8 cursor-pointer hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-5">
                  <div className="shrink-0">
                    <div className="text-xl md:text-2xl font-bold text-[#0A2540] dark:text-white tracking-tight">
                      {changelog.version}
                    </div>
                    <div className="text-xs text-[#0A2540]/40 dark:text-white/40 mt-0.5">
                      {changelog.date}
                    </div>
                  </div>

                  <div className="hidden md:block text-left">
                    {releaseTitle ? (
                      <span className="text-sm font-medium text-[#0A2540]/70 dark:text-white/70">
                        {releaseTitle}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#00D4B3]/10 text-[#00D4B3]">
                    {totalItems} {totalItems === 1 ? 'cambio' : 'cambios'}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-[#0A2540]/30 dark:text-white/30 transition-transform duration-300 ${
                      isVersionExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isVersionExpanded ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mx-8 h-px bg-black/[0.06] dark:bg-white/[0.06]" />

                    <div className="px-8 pt-4 pb-2">
                      <p className="text-sm text-[#0A2540]/50 dark:text-white/50 leading-relaxed">
                        Novedades y mejoras incluidas en esta version de SofLIA
                        Hub.
                      </p>
                    </div>

                    <div className="px-8 py-2">
                      {sections.map((section, sectionIndex) => {
                        const metadata =
                          DOWNLOADS_CHANGELOG_SECTION_META[
                            section.key as keyof typeof DOWNLOADS_CHANGELOG_SECTION_META
                          ] || DOWNLOADS_CHANGELOG_SECTION_META.fallback
                        const isExpanded =
                          expandedSections[`${changelog.version}-${section.key}`] ??
                          false
                        const hasItems = section.items.length > 0
                        const SectionIcon = metadata.icon

                        return (
                          <div key={section.key}>
                            <button
                              onClick={() =>
                                hasItems
                                  ? onToggleSection(changelog.version, section.key)
                                  : undefined
                              }
                              className={`w-full flex items-center justify-between py-4 group transition-colors ${
                                hasItems ? 'cursor-pointer' : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <SectionIcon size={16} className={metadata.color} />
                                <span
                                  className={`text-sm font-medium ${
                                    hasItems
                                      ? 'text-[#0A2540] dark:text-white'
                                      : 'text-[#0A2540]/30 dark:text-white/30'
                                  }`}
                                >
                                  {section.label}
                                </span>
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    hasItems
                                      ? 'bg-[#0A2540]/5 dark:bg-white/10 text-[#0A2540]/60 dark:text-white/60'
                                      : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#0A2540]/25 dark:text-white/25'
                                  }`}
                                >
                                  {section.items.length}
                                </span>
                              </div>
                              {hasItems ? (
                                <ChevronDown
                                  size={16}
                                  className={`text-[#0A2540]/30 dark:text-white/30 transition-transform duration-300 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              ) : null}
                            </button>

                            <AnimatePresence>
                              {isExpanded && hasItems ? (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.25,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="pb-4 pl-8 space-y-2.5">
                                    {section.items.map((item, itemIndex) => (
                                      <div
                                        key={itemIndex}
                                        className="flex items-start gap-3 group/item"
                                      >
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${metadata.dotColor} mt-2 shrink-0 opacity-60`}
                                        />
                                        <span className="text-sm text-[#0A2540]/70 dark:text-white/70 leading-relaxed">
                                          <span
                                            dangerouslySetInnerHTML={{
                                              __html: formatMarkdownBold(item),
                                            }}
                                          />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>

                            {sectionIndex < sections.length - 1 ? (
                              <div className="h-px bg-black/[0.04] dark:bg-white/[0.04]" />
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
