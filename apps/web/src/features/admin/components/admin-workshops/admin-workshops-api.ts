export async function updateAdminWorkshop(workshopId: string, data: unknown): Promise<void> {
  const response = await fetch(`/api/admin/workshops/${workshopId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (response.ok) return
  const errorData = await response.json().catch(() => ({}))
  const errorMessage =
    typeof errorData.error === 'string' ? errorData.error : 'Error al actualizar el taller'
  throw new Error(errorMessage)
}

export async function deleteAdminWorkshop(workshopId: string): Promise<void> {
  const response = await fetch(`/api/admin/workshops/${workshopId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.ok) return
  const errorData = await response.json().catch(() => ({}))
  const errorMessage =
    typeof errorData.error === 'string' ? errorData.error : 'Error al eliminar el taller'
  throw new Error(errorMessage)
}
