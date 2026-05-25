'use client'

import { motion } from 'framer-motion'
import { CheckCircleIcon, GlobeAltIcon, PauseCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import { SOFLIA_ADMIN_COLORS } from '../../constants/admin-color-tokens'
import type { CreateCompanyData } from './types'

export function AdminCreateCompanySidebarPreview(props: { formData: CreateCompanyData; primaryColor: string; accentColor: string }) {
  return (
    <div className="relative z-10 mb-8 text-center">
      <motion.div className="relative mb-4 inline-block" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-100 shadow-2xl backdrop-blur-sm dark:border-white/10 dark:bg-white/5" style={{ background: props.formData.brand_logo_url ? 'var(--color-bg-light)' : `linear-gradient(135deg, ${props.primaryColor}, ${props.accentColor})` }}>
          {props.formData.brand_logo_url ? <img src={props.formData.brand_logo_url} alt="Logo" className="h-full w-full object-contain p-2" /> : <PlusIcon className="h-10 w-10 text-white" />}
        </div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 rounded-full border border-bgSecondary p-1.5 shadow-lg" style={{ backgroundColor: props.formData.is_active ? SOFLIA_ADMIN_COLORS.success : SOFLIA_ADMIN_COLORS.warning }}>
          {props.formData.is_active ? <CheckCircleIcon className="h-3.5 w-3.5 text-white" /> : <PauseCircleIcon className="h-3.5 w-3.5 text-white" />}
        </motion.div>
      </motion.div>
      <h3 className="truncate px-2 text-xl font-bold text-gray-900 dark:text-white">{props.formData.name || 'Nueva Empresa'}</h3>
      <div className="mt-1 flex items-center justify-center gap-2 opacity-70"><GlobeAltIcon className="h-3 w-3 text-current" style={{ color: props.accentColor }} /><p className="text-xs font-mono text-gray-600 dark:text-white/80">{props.formData.slug ? `/${props.formData.slug}` : '/...'}</p></div>
    </div>
  )
}
