import type { AdminWorkshop, WorkshopStats } from '../../services/adminWorkshops.service'

export interface AdminWorkshopFilters {
  searchTerm: string
  category: string
  status: string
}

export interface WorkshopBadgeTone {
  bg: string
  text: string
  border: string
}

export interface AdminWorkshopsPageLogic {
  workshops: AdminWorkshop[]
  filteredWorkshops: AdminWorkshop[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  page: number
  stats: WorkshopStats | null
  isLoading: boolean
  error: string | null
  isUpdating: boolean
  isAddModalOpen: boolean
  editingWorkshop: AdminWorkshop | null
  workshopToDelete: AdminWorkshop | null
  searchTerm: string
  filterCategory: string
  filterStatus: string
  setSearchTerm: (value: string) => void
  setFilterCategory: (value: string) => void
  setFilterStatus: (value: string) => void
  setPage: (page: number) => void
  openAddModal: () => void
  closeAddModal: () => void
  openEditModal: (workshop: AdminWorkshop) => void
  closeEditModal: () => void
  openDeleteModal: (workshop: AdminWorkshop) => void
  closeDeleteModal: () => void
  handleViewWorkshop: (workshop: AdminWorkshop) => void
  handleWorkshopCreated: () => Promise<void>
  handleWorkshopUpdated: (data: unknown) => Promise<void>
  handleWorkshopDeleted: () => Promise<void>
  refetch: () => void
}
