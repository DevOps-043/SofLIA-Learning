'use client'

import { motion } from 'framer-motion'

export function AdminCreateCompanyToggleField(props: { label: string; activeLabel: string; inactiveLabel: string; value: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="mb-2 ml-1 block text-xs text-gray-600 dark:text-gray-400">{props.label}</label>
      <button type="button" onClick={props.onToggle} className="group flex h-[50px] w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-100 px-4 transition-colors hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
        <span className={`text-sm font-medium ${props.value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{props.value ? props.activeLabel : props.inactiveLabel}</span>
        <div className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${props.value ? 'bg-green-500' : 'bg-gray-600'}`}><motion.div animate={{ x: props.value ? 22 : 2 }} className="absolute top-1 left-0 h-4 w-4 rounded-full bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 30 }} /></div>
      </button>
    </div>
  )
}
