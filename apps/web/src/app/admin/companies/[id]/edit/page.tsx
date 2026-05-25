'use client'

import { useEditCompanyLogic } from '@/features/admin/hooks/useEditCompanyLogic'
import { useMotionSafe } from '@/lib/utils/motion'
import { EditCompanyErrorState } from './page-components/EditCompanyErrorState'
import { EditCompanyHeader } from './page-components/EditCompanyHeader'
import { EditCompanyLoadingState } from './page-components/EditCompanyLoadingState'
import { EditCompanySectionContent } from './page-components/EditCompanySectionContent'
import { EditCompanySidebar } from './page-components/EditCompanySidebar'

export default function EditCompanyPage() {
  const { interfaceTransition } = useMotionSafe()
  const logic = useEditCompanyLogic()

  if (logic.loading) return <EditCompanyLoadingState />
  if (logic.error && !logic.company) {
    return <EditCompanyErrorState error={logic.error} onBack={() => logic.router.push('/admin/companies')} />
  }
  if (!logic.company) return null

  return (
    <div className="min-h-screen bg-gray-50 font-inter text-gray-900 dark:bg-carbon-950 dark:text-white">
      <EditCompanyHeader
        companyName={logic.company.name}
        logoUrl={logic.company.brand_logo_url}
        saving={logic.saving}
        onBack={() => logic.router.back()}
        onSave={logic.handleSave}
      />
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1600px]">
        <EditCompanySidebar
          activeTab={logic.activeTab}
          interfaceTransition={interfaceTransition}
          onTabChange={logic.handleTabChange}
        />
        <EditCompanySectionContent
          activeTab={logic.activeTab}
          company={logic.company}
          companyId={logic.companyId}
          onUpdate={logic.loadCompany}
          setCompany={logic.setCompany}
        />
      </div>
    </div>
  )
}
