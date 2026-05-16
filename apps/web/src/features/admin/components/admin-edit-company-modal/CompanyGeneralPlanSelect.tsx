'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { PLAN_OPTIONS, colors, type CompanyFormData } from './company-form.constants'

export function CompanyGeneralPlanSelect(props: { formData: CompanyFormData; isOpen: boolean; onOpenChange: (open: boolean) => void; onChange: (value: string) => void }) {
  const selectedPlan = PLAN_OPTIONS.find((p) => p.value === props.formData.subscription_plan) || PLAN_OPTIONS[0]
  return (
    <div className="relative">
      <label className="mb-2 ml-1 block text-xs text-gray-400">Plan Actual</label>
      <button type="button" onClick={() => props.onOpenChange(!props.isOpen)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors hover:bg-white/10"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: selectedPlan.color }} /><span>{selectedPlan.label}</span></div><ChevronDownIcon className="h-4 w-4 text-gray-500 transition-transform" style={{ transform: props.isOpen ? 'rotate(180deg)' : 'none' }} /></button>
      <AnimatePresence>{props.isOpen ? <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl" style={{ backgroundColor: colors.bgTertiary }}>{PLAN_OPTIONS.map((opt) => <button key={opt.value} type="button" onClick={() => { props.onChange(opt.value); props.onOpenChange(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/10"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: opt.color }} /><div className="flex-1"><span className="block text-sm text-white">{opt.label}</span><span className="text-[10px] text-gray-500">{opt.description}</span></div>{props.formData.subscription_plan === opt.value ? <CheckCircleIcon className="h-4 w-4 text-white" /> : null}</button>)}</motion.div> : null}</AnimatePresence>
    </div>
  )
}
