'use client'

import { Users } from 'lucide-react'

import {
  ResponsiveDataTable,
  ResponsiveModalBody,
  ResponsiveModalFooter,
  ResponsiveModalPanel,
  ResponsiveModalViewport,
} from '@/core/layout'

import { ActionButton } from '../components/ActionButton'
import { ScenarioCanvas } from '../components/ScenarioCanvas'
import { Surface } from '../components/Surface'
import { smokeUserColumns, smokeUserRows } from '../mocks'
import { adminUserFields } from './scenario-data'

export function AdminUsersModalScenario() {
  return (
    <>
      <ScenarioCanvas
        eyebrow="Responsive Smoke"
        title="Admin Users"
        description="Tabla administrativa con modal de alta usando el wrapper responsive compartido. En mobile el panel debe ocupar el alto util y apilar acciones sin desbordar."
        actions={<ActionButton icon={<Users className="h-4 w-4" />} label="Agregar usuario" emphasis="primary" />}
      >
        <Surface title="Miembros" subtitle="Vista base que debe permanecer util debajo del modal.">
          <ResponsiveDataTable data={smokeUserRows} columns={smokeUserColumns} keyExtractor={(item) => item.id} tableMinWidthClassName="min-w-[720px]" />
        </Surface>
      </ScenarioCanvas>
      <ResponsiveModalViewport>
        <ResponsiveModalPanel size="lg" data-testid="admin-users-modal-panel" onClick={(event) => event.stopPropagation()}>
          <div className="border-b border-[#E9ECEF] px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white">Crear usuario administrativo</h2>
                <p className="mt-1 text-sm text-[#637489] dark:text-white/60">Formulario denso con grid adaptativo y footer sticky.</p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-[#EEF4FB] px-3 py-1 text-xs font-semibold text-[#0A2540] dark:bg-white/10 dark:text-white/70">Draft</span>
            </div>
          </div>
          <ResponsiveModalBody className="px-4 py-5 sm:px-6">
            <form className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {adminUserFields.map((field) => (
                <label key={field} className="space-y-2 text-sm font-medium text-[#0A2540] dark:text-white">
                  <span>{field}</span>
                  <input className="w-full rounded-2xl border border-[#DCE7F3] bg-[#F8FAFC] px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-white/5" placeholder={`Ingresar ${field.toLowerCase()}`} />
                </label>
              ))}
            </form>
          </ResponsiveModalBody>
          <ResponsiveModalFooter>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="rounded-2xl border border-[#DCE7F3] px-4 py-3 text-sm font-semibold text-[#0A2540] dark:border-white/10 dark:text-white">Cancelar</button>
              <button type="button" className="rounded-2xl bg-[#0A2540] px-4 py-3 text-sm font-semibold text-white">Guardar usuario</button>
            </div>
          </ResponsiveModalFooter>
        </ResponsiveModalPanel>
      </ResponsiveModalViewport>
    </>
  )
}
