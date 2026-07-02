'use client'

import { useEditCompanyLogic } from '@/features/admin/hooks/useEditCompanyLogic'
import { AdminDeleteCompanyModal } from '@/features/admin/components/admin-companies/AdminDeleteCompanyModal'
import { useMotionSafe } from '@/lib/utils/motion'
import { EditCompanyErrorState } from './page-components/EditCompanyErrorState'
import { EditCompanyHeroCard } from './page-components/EditCompanyHeroCard'
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
    <div className="w-full">
      <EditCompanyHeroCard
        company={logic.company}
        error={logic.error}
        saving={logic.saving}
        saveSuccess={logic.saveSuccess}
        onBack={() => logic.router.back()}
        onSave={logic.handleSave}
      />
      <div className="mt-6 flex gap-6">
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
          onDeleteClick={() => logic.setIsDeleteModalOpen(true)}
        />
      </div>
      <AdminDeleteCompanyModal
        companyName={logic.company.name}
        isOpen={logic.isDeleteModalOpen}
        isDeleting={logic.isDeleting}
        error={logic.deleteError}
        onClose={() => logic.setIsDeleteModalOpen(false)}
        onConfirm={(confirmText) => logic.handleDelete(confirmText)}
      />
    </div>
  )
}
