import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'

export interface CustomizationSectionProps {
  company: CompanyData
  setCompany: (company: CompanyData) => void
}
