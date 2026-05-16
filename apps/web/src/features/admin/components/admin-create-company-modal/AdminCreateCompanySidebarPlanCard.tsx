'use client'

import type { CreateCompanyData, PlanOption } from './types'

export function AdminCreateCompanySidebarPlanCard(props: { formData: CreateCompanyData; selectedPlan: PlanOption }) {
  return (
    <div className="relative z-10 mt-6 border-t border-gray-200 pt-6 dark:border-white/5">
      <div className="rounded-xl border border-gray-200 bg-gray-100 p-3 dark:border-white/5 dark:bg-white/5">
        <div className="mb-2 flex items-center justify-between"><p className="text-[10px] uppercase tracking-wider text-gray-400">Plan Seleccionado</p><div className="h-2 w-2 rounded-full" style={{ backgroundColor: props.selectedPlan.color }} /></div>
        <p className="text-lg font-bold leading-none text-gray-900 dark:text-white">{props.selectedPlan.label}</p>
        <p className="mt-1 text-xs text-gray-500">{props.formData.max_users} usuarios max.</p>
      </div>
    </div>
  )
}
