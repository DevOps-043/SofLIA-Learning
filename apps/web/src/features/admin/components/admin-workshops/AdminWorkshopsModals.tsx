'use client'

import { AddWorkshopModal } from '../AddWorkshopModal'
import { DeleteWorkshopModal } from '../DeleteWorkshopModal'
import { EditWorkshopModal } from '../EditWorkshopModal'
import type { AdminWorkshop } from '../../services/adminWorkshops.service'

interface AdminWorkshopsModalsProps {
  isAddModalOpen: boolean
  editingWorkshop: AdminWorkshop | null
  workshopToDelete: AdminWorkshop | null
  onCloseAdd: () => void
  onCloseEdit: () => void
  onCloseDelete: () => void
  onSaveCreate: () => Promise<void>
  onSaveEdit: (data: Partial<AdminWorkshop>) => Promise<void>
  onConfirmDelete: () => Promise<void>
}

export function AdminWorkshopsModals(props: AdminWorkshopsModalsProps) {
  return (
    <>
      <AddWorkshopModal isOpen={props.isAddModalOpen} onClose={props.onCloseAdd} onSave={props.onSaveCreate} />
      <EditWorkshopModal workshop={props.editingWorkshop} onClose={props.onCloseEdit} onSave={props.onSaveEdit} />
      <DeleteWorkshopModal isOpen={Boolean(props.workshopToDelete)} onClose={props.onCloseDelete} workshop={props.workshopToDelete} onConfirm={props.onConfirmDelete} />
    </>
  )
}
