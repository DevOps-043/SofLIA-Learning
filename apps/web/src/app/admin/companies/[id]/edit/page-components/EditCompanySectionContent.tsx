'use client'

import { AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

// Each tab is only ever rendered one at a time (see the switch below), but
// GeneralSection/UsersSection/AdminCoursesSection/StatsSection/CustomizationSection
// were all imported eagerly, so every tab paid the compile/bundle cost of the
// heaviest one — StatsSection alone pulls in the entire BusinessReportsAnalytics
// tree (charts, PDF/Excel export, AI insights) and UsersSection now pulls in
// BusinessUserStatsModal/BusinessEditUserModal. Loading each tab lazily means
// opening "Cursos" no longer has to compile/download the other four tabs first.
const GeneralSection = dynamic(
  () => import('../sections/GeneralSection').then((mod) => mod.GeneralSection),
  { loading: SectionLoadingFallback, ssr: false },
)
const UsersSection = dynamic(
  () => import('../sections/UsersSection').then((mod) => mod.UsersSection),
  { loading: SectionLoadingFallback, ssr: false },
)
const AdminCoursesSection = dynamic(
  // Import the file directly, not the `@/features/admin/components` barrel —
  // that barrel re-exports every admin page (companies, learning paths, LIA
  // analytics, etc.) from one module, so importing through it would still
  // drag all of that in just to open this one tab.
  () => import('@/features/admin/components/CoursesSection').then((mod) => mod.CoursesSection),
  { loading: SectionLoadingFallback, ssr: false },
)
const StatsSection = dynamic(
  () => import('../sections/StatsSection').then((mod) => mod.StatsSection),
  { loading: SectionLoadingFallback, ssr: false },
)
const CustomizationSection = dynamic(
  () => import('../sections/CustomizationSection').then((mod) => mod.CustomizationSection),
  { loading: SectionLoadingFallback, ssr: false },
)

function SectionLoadingFallback() {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-24 dark:border-white/5 dark:bg-carbon-800">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
    </div>
  )
}

interface EditCompanySectionContentProps {
  activeTab: string
  company: CompanyData
  companyId: string
  onUpdate: () => void
  setCompany: (company: CompanyData) => void
  onDeleteClick: () => void
}

export function EditCompanySectionContent(props: EditCompanySectionContentProps) {
  return (
    <div className="flex-1 min-w-0">
      <AnimatePresence initial={false}>{renderSection(props)}</AnimatePresence>
    </div>
  )
}

function renderSection({
  activeTab,
  company,
  companyId,
  onUpdate,
  setCompany,
  onDeleteClick,
}: EditCompanySectionContentProps) {
  switch (activeTab) {
    case 'general':
      return <GeneralSection company={company} setCompany={setCompany} onDeleteClick={onDeleteClick} />
    case 'users':
      return <UsersSection company={company} onUpdate={onUpdate} />
    case 'courses':
      return <AdminCoursesSection companyId={companyId} />
    case 'stats':
      return <StatsSection company={company} />
    case 'customization':
      return <CustomizationSection company={company} setCompany={setCompany} />
    default:
      return <GeneralSection company={company} setCompany={setCompany} onDeleteClick={onDeleteClick} />
  }
}
