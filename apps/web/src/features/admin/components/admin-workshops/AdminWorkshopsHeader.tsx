'use client'

import { PlusIcon, RectangleStackIcon } from '@heroicons/react/24/outline'

import { AdminButton, AdminSectionHeader } from '../ui'

interface AdminWorkshopsHeaderProps {
  onCreateWorkshop: () => void
}

export function AdminWorkshopsHeader({
  onCreateWorkshop,
}: AdminWorkshopsHeaderProps) {
  return (
    <AdminSectionHeader
      size="page"
      kicker="Contenido"
      icon={RectangleStackIcon}
      title="Gestion de talleres"
      description="Administra el catalogo formativo, estados, instructores y duracion de los talleres."
      actions={
        <AdminButton onClick={onCreateWorkshop} icon={PlusIcon}>
          Crear taller
        </AdminButton>
      }
    />
  )
}
