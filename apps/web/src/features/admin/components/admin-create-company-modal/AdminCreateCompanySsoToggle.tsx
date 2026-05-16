'use client'

import { motion } from 'framer-motion'

export function AdminCreateCompanySsoToggle(props: { label: string; dotColor: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-100 p-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: props.dotColor }} /><span className="text-sm text-gray-900 dark:text-white">{props.label}</span></div>
      <button type="button" onClick={props.onToggle} className={`relative h-5 w-10 rounded-full transition-colors duration-300 ${props.value ? 'bg-green-500' : 'bg-gray-600'}`}><motion.div animate={{ x: props.value ? 22 : 2 }} className="absolute top-0.5 left-0 h-4 w-4 rounded-full bg-white shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 30 }} /></button>
    </div>
  )
}
