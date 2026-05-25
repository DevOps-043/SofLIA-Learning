'use client'

import { motion } from 'framer-motion'
import { Check, Copy, Link as LinkIcon } from 'lucide-react'
import type { PersonalizationTabState } from './personalization.types'

export function AccessLinksCard({ state }: { state: PersonalizationTabState }) {
  const links = [
    { label: 'Link de Login', url: state.loginUrl, copied: state.copiedLogin, type: 'login' as const },
    { label: 'Link de Registro', url: state.registerUrl, copied: state.copiedRegister, type: 'register' as const },
  ]

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-slate-700/30">
      <div className="relative flex items-center gap-3 mb-6">
        <motion.div whileHover={{ rotate: 15, scale: 1.1 }} className="p-3 rounded-xl bg-primary">
          <LinkIcon className="w-5 h-5 text-white" />
        </motion.div>
        <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Links de Acceso</h3><p className="text-sm text-gray-500 dark:text-gray-400">Comparte estos links con tus empleados</p></div>
      </div>
      <div className="space-y-4">
        {links.map((item, index) => (
          <motion.div key={item.type} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }}>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{item.label}</label>
            <div className="flex items-center gap-2">
              <input type="text" value={item.url} readOnly className="flex-1 px-4 py-3 rounded-xl text-sm bg-white dark:bg-white/5 border-2 cursor-default border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300" />
              <motion.button type="button" onClick={() => state.copyToClipboard(item.url, item.type)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-lg text-white ${item.copied ? 'bg-success' : 'bg-primary'}`}>
                {item.copied ? <><Check className="w-4 h-4" /><span className="hidden sm:inline">Copiado</span></> : <><Copy className="w-4 h-4" /><span className="hidden sm:inline">Copiar</span></>}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
