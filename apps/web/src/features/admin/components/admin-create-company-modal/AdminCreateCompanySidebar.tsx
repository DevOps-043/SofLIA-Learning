'use client'

import { AdminCreateCompanySidebarNav } from './AdminCreateCompanySidebarNav'
import { AdminCreateCompanySidebarPlanCard } from './AdminCreateCompanySidebarPlanCard'
import { AdminCreateCompanySidebarPreview } from './AdminCreateCompanySidebarPreview'
import type { CreateCompanyData, CreateTab, PlanOption } from './types'

interface AdminCreateCompanySidebarProps {
  activeTab: CreateTab
  formData: CreateCompanyData
  selectedPlan: PlanOption
  primaryColor: string
  accentColor: string
  onTabChange: (tab: CreateTab) => void
}

export function AdminCreateCompanySidebar(props: AdminCreateCompanySidebarProps) {
  return (
    <div className="relative hidden w-[320px] shrink-0 flex-col border-r border-gray-200 p-8 dark:border-white/5 lg:flex" style={{ background: `linear-gradient(135deg, ${props.primaryColor}15, ${props.accentColor}10)` }}>
      <div className="absolute top-0 right-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-gray-200/50 blur-3xl pointer-events-none dark:bg-white/5" />
      <AdminCreateCompanySidebarPreview formData={props.formData} primaryColor={props.primaryColor} accentColor={props.accentColor} />
      <AdminCreateCompanySidebarNav activeTab={props.activeTab} accentColor={props.accentColor} onTabChange={props.onTabChange} />
      <AdminCreateCompanySidebarPlanCard formData={props.formData} selectedPlan={props.selectedPlan} />
    </div>
  )
}
