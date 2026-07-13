import { Metadata } from 'next'
import { Suspense } from 'react'
import { AdminUsersPage } from '@/features/admin/components/AdminUsersPage'

export const metadata: Metadata = {
  title: 'Gestión de Usuarios | Panel de Administración',
  description: 'Gestiona todos los usuarios de la plataforma.',
}

// AdminUsersPage usa useSearchParams (deep-link del Panel Maestro), por lo que
// necesita un boundary de Suspense para el prerender.
export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <AdminUsersPage />
    </Suspense>
  )
}
