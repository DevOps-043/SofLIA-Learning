'use client'

import { AnimatePresence } from 'framer-motion'
import { AdminCreateCompanyModal } from '../AdminCreateCompanyModal'
import { AdminEditCompanyModal } from '../AdminEditCompanyModal'
import { AdminCompanyViewModal } from './AdminCompanyViewModal'
import type { AdminCompaniesThemeColors } from '../../services/admin-companies'
import type { CreateCompanyData } from '../admin-create-company-modal'
import type { AdminCompany } from '../../types/admin-companies.types'

interface AdminCompaniesModalsProps {
  viewCompany: AdminCompany | null
  editCompany: AdminCompany | null
  showCreateModal: boolean
  isSaving: boolean
  isCreating: boolean
  themeColors: AdminCompaniesThemeColors
  onCloseView: () => void
  onOpenEditFromView: () => void
  onCloseEdit: () => void
  onCloseCreate: () => void
  onSaveEdit: (data: Partial<AdminCompany>) => Promise<void>
  onCreateCompany: (data: CreateCompanyData) => Promise<void>
}

export function AdminCompaniesModals(props: AdminCompaniesModalsProps) {
  return (
    <AnimatePresence>
      {props.viewCompany ? <AdminCompanyViewModal company={props.viewCompany} onClose={props.onCloseView} onEdit={props.onOpenEditFromView} themeColors={props.themeColors} /> : null}
      {props.editCompany ? <AdminEditCompanyModal company={props.editCompany} onClose={props.onCloseEdit} onSave={props.onSaveEdit} isSaving={props.isSaving} /> : null}
      {props.showCreateModal ? <AdminCreateCompanyModal onClose={props.onCloseCreate} onCreate={props.onCreateCompany} isCreating={props.isCreating} /> : null}
    </AnimatePresence>
  )
}
