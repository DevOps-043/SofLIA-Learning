import type { ImportResult } from './import-users.types'

export async function downloadImportUsersTemplate() {
  const response = await fetch('/api/business/users/template', { credentials: 'include' })
  if (!response.ok) throw new Error('download_failed')

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'plantilla-importacion-usuarios.csv'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export async function importUsersFile(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/business/users/import', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = await response.json()

  if (!response.ok) throw new Error(data.error || 'Error al importar usuarios')
  if (!data.success || !data.result) throw new Error('Error en la respuesta del servidor')

  return data.result as ImportResult
}
