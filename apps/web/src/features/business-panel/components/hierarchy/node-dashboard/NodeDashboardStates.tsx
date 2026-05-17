'use client'

import { AlertCircle } from 'lucide-react'
import type { NodeDashboardTranslations } from './node-dashboard.types'

export function NodeDashboardLoadingState({ t }: Pick<NodeDashboardTranslations, 't'>) {
  return <div className="flex h-[50vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" /><p className="text-gray-400">{t('hierarchy.dashboard.loading')}</p></div></div>
}

export function NodeDashboardErrorState({ error, t, tc }: NodeDashboardTranslations & { error: string | null }) {
  return <div className="flex h-[50vh] items-center justify-center"><div className="mx-auto max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center"><AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" /><h3 className="mb-2 text-lg font-bold text-white">{t('hierarchy.dashboard.error.title')}</h3><p className="text-red-300">{error || t('hierarchy.dashboard.error.notFound')}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-red-300 transition-colors hover:bg-red-500/30">{tc('actions.retry')}</button></div></div>
}
