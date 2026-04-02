import type { AdminCompany, CompanyStats } from '../../types/admin-companies.types'

export function calculateCompanyStats(companies: AdminCompany[]): CompanyStats {
  const stats = companies.reduce(
    (summary, company) => {
      summary.totalCompanies += 1

      const normalizedStatus = company.subscription_status?.toLowerCase()

      if (normalizedStatus === 'pending' && !company.is_active) {
        summary.pendingCompanies += 1
      } else if (company.is_active) {
        summary.activeCompanies += 1
      } else {
        summary.pausedCompanies += 1
      }

      if (
        normalizedStatus === 'trial' ||
        (company.subscription_plan && company.subscription_plan.toLowerCase() === 'trial')
      ) {
        summary.trialCompanies += 1
      }

      summary.totalSeats += company.max_users || 0
      summary.usedSeats += company.active_users
      return summary
    },
    {
      totalCompanies: 0,
      activeCompanies: 0,
      trialCompanies: 0,
      pausedCompanies: 0,
      pendingCompanies: 0,
      totalSeats: 0,
      usedSeats: 0,
    }
  )

  return {
    ...stats,
    averageUtilization:
      stats.totalCompanies > 0 ? Math.round((stats.usedSeats / Math.max(stats.totalSeats, 1)) * 100) : 0,
  }
}
