import type { DashboardLayout } from './custom-dashboard.types'

export async function fetchDashboardLayout(orgSlug: string) {
  const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, { credentials: 'include' })
  const data = await response.json()

  if (!data.success || !data.layout) {
    throw new Error(data.error || 'Error al cargar el layout')
  }

  return data.layout as DashboardLayout
}

export async function saveDashboardLayout(orgSlug: string, layout: DashboardLayout) {
  const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: layout.name,
      layout_config: layout.layout_config,
      is_default: layout.is_default,
    }),
  })
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Error al guardar el layout')
  }
}

export async function resetDashboardLayout(orgSlug: string) {
  const response = await fetch(`/api/${orgSlug}/business/dashboard/layout`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Error al restablecer el layout')
  }
}
