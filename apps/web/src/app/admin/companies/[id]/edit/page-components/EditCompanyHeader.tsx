'use client'

import { ArrowLeftIcon, ArrowPathIcon, BuildingOffice2Icon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface EditCompanyHeaderProps {
  companyName: string
  logoUrl?: string | null
  saving: boolean
  onBack: () => void
  onSave: () => void
}

export function EditCompanyHeader({
  companyName,
  logoUrl,
  saving,
  onBack,
  onSave,
}: EditCompanyHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-carbon-800">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack} className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-muted dark:hover:bg-white/5">
            <ArrowLeftIcon className="h-6 w-6" />
          </motion.button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 dark:border-accent/20 dark:bg-accent/10">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <BuildingOffice2Icon className="h-6 w-6 text-primary dark:text-accent" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{companyName}</h1>
              <p className="text-xs text-gray-500 dark:text-muted">Gestión de empresa</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary disabled:opacity-50 dark:bg-accent dark:text-primary dark:shadow-accent/20 dark:hover:bg-accent"
        >
          {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </motion.button>
      </div>
    </div>
  )
}
