'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { PLAN_OPTIONS } from './service'
import type { CreateCompanyData, PlanOption } from './types'

export function AdminCreateCompanyPlanSelect(props: { formData: CreateCompanyData; isOpen: boolean; selectedPlan: PlanOption; onOpenChange: (value: boolean) => void; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <label className="mb-2 ml-1 block text-xs text-gray-600 dark:text-gray-400">Plan</label>
      <button type="button" onClick={() => props.onOpenChange(!props.isOpen)} className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-900 transition-colors hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: props.selectedPlan.color }} /><span>{props.selectedPlan.label}</span></div>
        <ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform" style={{ transform: props.isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>
      <AnimatePresence>{props.isOpen ? <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-carbon-950">{PLAN_OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => { props.onChange(option.value); props.onOpenChange(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/10"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} /><div className="flex-1"><span className="block text-sm text-gray-900 dark:text-white">{option.label}</span><span className="text-[10px] text-gray-500">{option.description}</span></div>{props.formData.subscription_plan === option.value ? <CheckCircleIcon className="h-4 w-4 text-gray-900 dark:text-white" /> : null}</button>)}</motion.div> : null}</AnimatePresence>
    </div>
  )
}
