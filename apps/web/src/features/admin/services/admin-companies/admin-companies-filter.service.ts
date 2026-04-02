import type { AdminCompany } from '../../types/admin-companies.types'

export interface AdminCompaniesFilters {
  searchTerm: string
  planFilter: string
  statusFilter: string
}

export function filterAdminCompanies(
  companies: AdminCompany[],
  { searchTerm, planFilter, statusFilter }: AdminCompaniesFilters
): AdminCompany[] {
  const normalizedSearchTerm = searchTerm.toLowerCase()

  return companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(normalizedSearchTerm) ||
      (company.slug?.toLowerCase().includes(normalizedSearchTerm) ?? false) ||
      (company.contact_email?.toLowerCase().includes(normalizedSearchTerm) ?? false)

    const matchesPlan =
      planFilter === 'all' ||
      company.subscription_plan?.toLowerCase() === planFilter

    const normalizedStatus = company.subscription_status?.toLowerCase()
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && company.is_active && normalizedStatus !== 'trial') ||
      (statusFilter === 'trial' && normalizedStatus === 'trial') ||
      (statusFilter === 'pending' && normalizedStatus === 'pending' && !company.is_active) ||
      (statusFilter === 'paused' && !company.is_active && normalizedStatus !== 'pending') ||
      (statusFilter === 'expired' && normalizedStatus === 'expired')

    return matchesSearch && matchesPlan && matchesStatus
  })
}
