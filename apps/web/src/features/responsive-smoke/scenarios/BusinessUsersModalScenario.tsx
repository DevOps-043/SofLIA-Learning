'use client'

import { Plus } from 'lucide-react'

import { ResponsiveDataTable } from '@/core/layout'
import { BusinessAddUserModal } from '@/features/business-panel/components/BusinessAddUserModal'

import { ActionButton } from '../components/ActionButton'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeUserColumns, smokeUserRows } from '../mocks'

export function BusinessUsersModalScenario() {
  return (
    <>
      <ScenarioCanvas
        eyebrow="Responsive Smoke"
        title="Business Users"
        description="Tabla real de analitica de usuarios con cards mobile y modal real de alta de usuario montado sobre la vista."
        actions={<ActionButton icon={<Plus className="h-4 w-4" />} label="Invitar usuario" emphasis="primary" />}
      >
        <Surface title="Adopcion por usuario" subtitle="La tabla se convierte en lista de cards debajo de md.">
          <ResponsiveDataTable data={smokeUserRows} columns={smokeUserColumns} keyExtractor={(item) => item.id} tableMinWidthClassName="min-w-[720px]" />
        </Surface>
      </ScenarioCanvas>
      <BusinessAddUserModal isOpen onClose={() => undefined} onSave={async () => undefined} />
    </>
  )
}
