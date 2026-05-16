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
    <div className="sticky top-0 z-30 border-b border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1E2329]">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack} className="rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-[#8899A6] dark:hover:bg-white/5">
            <ArrowLeftIcon className="h-6 w-6" />
          </motion.button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0A2540]/20 bg-[#0A2540]/10 dark:border-[#00D4B3]/20 dark:bg-[#00D4B3]/10">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-full w-full object-contain p-2" />
              ) : (
                <BuildingOffice2Icon className="h-6 w-6 text-[#0A2540] dark:text-[#00D4B3]" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{companyName}</h1>
              <p className="text-xs text-gray-500 dark:text-[#8899A6]">Gestión de empresa</p>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#0A2540] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0A2540]/20 transition-all hover:bg-[#0d2f4d] disabled:opacity-50 dark:bg-[#00D4B3] dark:text-[#0A2540] dark:shadow-[#00D4B3]/20 dark:hover:bg-[#00b89a]"
        >
          {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </motion.button>
      </div>
    </div>
  )
}
