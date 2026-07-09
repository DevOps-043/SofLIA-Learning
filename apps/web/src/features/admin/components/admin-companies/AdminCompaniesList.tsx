'use client'

import { AnimatePresence } from 'framer-motion'
import type { AdminCompany } from '../../types/admin-companies.types'
import { AdminCompaniesEmptyState } from './AdminCompaniesState'
import { AdminCompanyListRow } from './AdminCompanyListRow'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompaniesListProps {
  companies: AdminCompany[]
  themeColors: AdminCompaniesThemeColors
  onView: (company: AdminCompany) => void
}

export function AdminCompaniesList({ companies, themeColors, onView }: AdminCompaniesListProps) {
  return (
    <section className="flex flex-col gap-3">
      <AnimatePresence>
        {companies.length === 0 ? (
          <AdminCompaniesEmptyState themeColors={themeColors} />
        ) : (
          companies.map((company, index) => (
            <AdminCompanyListRow
              key={company.id}
              company={company}
              onView={() => onView(company)}
              themeColors={themeColors}
              index={index}
            />
          ))
        )}
      </AnimatePresence>
    </section>
  )
}
