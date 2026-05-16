'use client'

import { AnimatePresence } from 'framer-motion'
import { CoursesSection as AdminCoursesSection } from '@/features/admin/components'
import { CertificatesSection } from '../sections/CertificatesSection'
import { CustomizationSection } from '../sections/CustomizationSection'
import { GeneralSection } from '../sections/GeneralSection'
import { NotificationsSection } from '../sections/NotificationsSection'
import { StatsSection } from '../sections/StatsSection'
import { UsersSection } from '../sections/UsersSection'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

interface EditCompanySectionContentProps {
  activeTab: string
  company: CompanyData
  companyId: string
  onUpdate: () => void
  setCompany: (company: CompanyData) => void
}

export function EditCompanySectionContent(props: EditCompanySectionContentProps) {
  return (
    <div className="flex-1 min-w-0 p-4 md:p-6">
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
}: EditCompanySectionContentProps) {
  switch (activeTab) {
    case 'general':
      return <GeneralSection company={company} setCompany={setCompany} />
    case 'users':
      return <UsersSection company={company} onUpdate={onUpdate} />
    case 'courses':
      return <AdminCoursesSection companyId={companyId} />
    case 'stats':
      return <StatsSection company={company} />
    case 'customization':
      return <CustomizationSection company={company} setCompany={setCompany} />
    case 'notifications':
      return <NotificationsSection company={company} />
    case 'certificates':
      return <CertificatesSection company={company} />
    default:
      return <GeneralSection company={company} setCompany={setCompany} />
  }
}
