'use client'

import { Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ViewReporteEvidenceProps {
  screenshotUrl?: string | null
}

export function ViewReporteEvidence({ screenshotUrl }: ViewReporteEvidenceProps) {
  const { t } = useTranslation('admin')
  if (!screenshotUrl) return null

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('reportesPage.viewModal.evidence')}</h3>
      <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-2xl border border-slate-200 bg-black/5 dark:border-white/10 dark:bg-black/20">
        <img src={screenshotUrl} alt={t('reportesPage.viewModal.screenshotAlt')} className="max-h-[320px] w-full object-contain" />
        <span className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><Image className="h-4 w-4" />{t('reportesPage.viewModal.openImage')}</span>
      </a>
    </section>
  )
}
