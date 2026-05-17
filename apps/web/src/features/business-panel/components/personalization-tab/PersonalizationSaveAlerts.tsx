'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function PersonalizationSaveAlerts({
  saveError,
  saveSuccess,
}: {
  saveError: string | null
  saveSuccess: string | null
}) {
  return (
    <>
      {saveSuccess && <SaveAlert icon={<CheckCircle className="w-6 h-6 text-emerald-400" />} text={saveSuccess} tone="success" />}
      {saveError && <SaveAlert icon={<AlertCircle className="w-6 h-6 text-red-400" />} text={saveError} tone="error" />}
    </>
  )
}

function SaveAlert({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: 'success' | 'error' }) {
  const className = tone === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
  return (
    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 border ${className}`}>
      {icon}
      <p className="font-medium">{text}</p>
    </motion.div>
  )
}
