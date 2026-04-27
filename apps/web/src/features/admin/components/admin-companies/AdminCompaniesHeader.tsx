'use client'

import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

import { AdminButton, AdminSectionHeader } from '../ui'

interface AdminCompaniesHeaderProps {
  onRefresh: () => void
  onCreate: () => void
}

export function AdminCompaniesHeader({
  onRefresh,
  onCreate,
}: AdminCompaniesHeaderProps) {
  return (
    <AdminSectionHeader
      size="page"
      kicker="Gestion B2B"
      icon={SparklesIcon}
      title="Administracion de empresas"
      description="Gestiona organizaciones, planes, licencias, activacion y configuraciones empresariales."
      actions={
        <>
          <AdminButton onClick={onRefresh} variant="secondary" icon={ArrowPathIcon}>
            Actualizar
          </AdminButton>
          <AdminButton onClick={onCreate} variant="primary" icon={BuildingOffice2Icon}>
            Nueva organizacion
          </AdminButton>
        </>
      }
    />
  )
}
