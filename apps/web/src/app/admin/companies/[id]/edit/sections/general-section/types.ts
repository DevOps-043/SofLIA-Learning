import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

export interface GeneralSectionProps {
  company: CompanyData
  setCompany: (company: CompanyData) => void
}
