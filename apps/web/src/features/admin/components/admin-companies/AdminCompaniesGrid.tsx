'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { AdminCompany } from '../../types/admin-companies.types'
import { AdminCompaniesEmptyState } from './AdminCompaniesState'
import { AdminCompanyCard } from './AdminCompanyCard'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'

interface AdminCompaniesGridProps {
  companies: AdminCompany[]
  themeColors: AdminCompaniesThemeColors
  onView: (company: AdminCompany) => void
}

export function AdminCompaniesGrid(props: AdminCompaniesGridProps) {
  const { companies, themeColors, onView } = props
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence>
        {companies.length === 0 ? (
          <AdminCompaniesEmptyState themeColors={themeColors} />
        ) : (
          companies.map((company, index) => (
            <motion.div key={company.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.05 }}>
              <AdminCompanyCard company={company} onView={() => onView(company)} themeColors={themeColors} />
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </section>
  )
}
