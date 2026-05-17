import type { AdminCompany, LpTranslator } from './types'

interface AssignOrganizationCardProps {
  availableOrganizations: AdminCompany[]
  lp: LpTranslator
  saving: boolean
  selectedOrganizationId: string
  setSelectedOrganizationId: (value: string) => void
  onAssign: () => Promise<void>
}

export function AssignOrganizationCard({
  availableOrganizations,
  lp,
  saving,
  selectedOrganizationId,
  setSelectedOrganizationId,
  onAssign,
}: AssignOrganizationCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{lp('assignOrganizationTitle', 'Asignar a empresa')}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
        {lp('assignOrganizationDescription', 'Entrega esta ruta completa a una organizacion con el orden secuencial ya definido.')}
      </p>
      <div className="mt-4 space-y-3">
        <select
          value={selectedOrganizationId}
          onChange={event => setSelectedOrganizationId(event.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--color-accent)] dark:border-white/10 dark:bg-gray-900 dark:text-white"
        >
          <option value="">{lp('selectOrganization', 'Selecciona una empresa')}</option>
          {availableOrganizations.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
        </select>
        <button
          type="button"
          disabled={!selectedOrganizationId || saving}
          onClick={() => void onAssign()}
          className="w-full rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? lp('assigning', 'Asignando...') : lp('assignOrganizationButton', 'Asignar a empresa')}
        </button>
      </div>
    </div>
  )
}
