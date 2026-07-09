import { Metadata } from 'next'
import { AdminUsersPage } from '@/features/admin/components/AdminUsersPage'

export const metadata: Metadata = {
  title: 'Gestión de Usuarios | Panel de Administración',
  description: 'Gestiona todos los usuarios de la plataforma.',
}

export default function UsersPage() {
  return <AdminUsersPage />
}
