'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Link as LinkIcon, Loader2, Save } from 'lucide-react'
import type { OrganizationData } from '../../hooks/useBusinessSettings'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { PersonalizationTabState } from './personalization.types'

export function SlugSettingsCard({
  organization,
  state,
}: {
  organization: OrganizationData
  state: PersonalizationTabState
}) {
  const theme = useBusinessPanelTheme()

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-slate-700/30">
      <div className="relative flex items-center gap-3 mb-6">
        <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="p-3 rounded-xl" style={{ backgroundColor: theme.actionColor }}>
          <LinkIcon className="w-5 h-5" style={{ color: theme.onActionColor }} />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Identificador de URL</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Define el identificador unico para tu link de login</p>
        </div>
      </div>
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Identificador (slug) *</label>
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <div className="flex items-center">
            <span className="px-4 py-3 rounded-l-xl border-2 border-r-0 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-sm border-gray-200 dark:border-white/10">{state.baseUrl}/auth/</span>
            <input type="text" value={state.slug} onChange={state.handleSlugChange} placeholder="mi-empresa" className={`flex-1 px-4 py-3 rounded-r-xl border-2 transition-all duration-300 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${state.slugError ? 'border-red-500 focus:border-red-500' : state.slugAvailable === true ? 'border-green-500 focus:border-green-500' : 'border-gray-200 dark:border-white/10 focus:border-amber-500'}`} />
          </div>
          {state.isCheckingSlug && <div className="absolute right-3 top-1/2 -translate-y-1/2"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full" /></div>}
          {!state.isCheckingSlug && state.slugAvailable === true && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-5 h-5 text-green-500" /></div>}
        </div>
        <motion.button type="button" onClick={state.handleSaveSlug} disabled={state.isSaving || !state.slug || !!state.slugError || state.slugAvailable !== true} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg bg-warning text-white">
          {state.isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : <><Save className="w-4 h-4" />Guardar</>}
        </motion.button>
      </div>
      <SlugValidationMessage organizationSlug={organization.slug} state={state} />
    </motion.div>
  )
}

function SlugValidationMessage({ organizationSlug, state }: { organizationSlug?: string | null; state: PersonalizationTabState }) {
  if (state.slugError) return <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-400 mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{state.slugError}</motion.p>
  if (state.slugAvailable === true && state.slug !== organizationSlug) return <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-green-400 mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" />Identificador disponible</motion.p>
  return null
}
