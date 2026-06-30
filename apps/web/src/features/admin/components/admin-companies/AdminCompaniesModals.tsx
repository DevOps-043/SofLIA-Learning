'use client'

import { AnimatePresence } from 'framer-motion'
import { AdminCreateCompanyModal } from '../AdminCreateCompanyModal'
import { AdminCompanyViewModal } from './AdminCompanyViewModal'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'
import type { CreateCompanyData } from '../admin-create-company-modal'
import type { AdminCompany } from '../../types/admin-companies.types'

interface AdminCompaniesModalsProps {
  viewCompany: AdminCompany | null
  showCreateModal: boolean
  isCreating: boolean
  themeColors: AdminCompaniesThemeColors
  onCloseView: () => void
  onCloseCreate: () => void
  onCreateCompany: (data: CreateCompanyData) => Promise<void>
}

export function AdminCompaniesModals(props: AdminCompaniesModalsProps) {
  return (
    <AnimatePresence>
      {props.viewCompany ? <AdminCompanyViewModal company={props.viewCompany} onClose={props.onCloseView} themeColors={props.themeColors} /> : null}
      {props.showCreateModal ? <AdminCreateCompanyModal onClose={props.onCloseCreate} onCreate={props.onCreateCompany} isCreating={props.isCreating} /> : null}
    </AnimatePresence>
  )
}
