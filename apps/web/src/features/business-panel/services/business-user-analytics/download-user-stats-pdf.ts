'use client'

import type {
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsRange,
} from '@/features/business-panel/types/business-user-analytics.types'

export interface DownloadUserStatsPdfParams {
  /** Ruta base alternativa (panel de super-admin). Tiene prioridad sobre `orgSlug`. */
  apiBasePath?: string | null
  orgSlug?: string | null
  /** Usuario retratado. Ausente cuando el lector consulta sus propias estadísticas. */
  userId?: string | null
  organizationId?: string | null
  range: BusinessUserAnalyticsRange
  locale: BusinessUserAnalyticsLocale
}

export interface DownloadUserStatsPdfResult {
  /** `true` si el servidor devolvió el informe ya generado hoy. */
  reused: boolean
  reportDate: string | null
}

/**
 * Descarga el PDF de estadísticas pidiéndoselo al servidor.
 *
 * El documento se genera una vez al día por usuario, idioma y rango: si ya
 * existe el de hoy, el servidor devuelve ese mismo archivo sin volver a llamar a
 * SofLIA. Por eso la generación vive en el servidor y no aquí.
 */
export async function downloadUserStatsPdf(
  params: DownloadUserStatsPdfParams,
): Promise<DownloadUserStatsPdfResult> {
  const endpoint = buildEndpoint(params)

  if (!endpoint) {
    throw new Error('No se pudo determinar la ruta del informe')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      range: params.range,
      locale: params.locale,
      ...(params.apiBasePath && params.organizationId
        ? { organizationId: params.organizationId }
        : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const blob = await response.blob()
  triggerBrowserDownload(blob, resolveFileName(response))

  return {
    reused: response.headers.get('X-Daily-Report-Reused') === '1',
    reportDate: response.headers.get('X-Daily-Report-Date'),
  }
}

function buildEndpoint(params: DownloadUserStatsPdfParams): string | null {
  if (params.apiBasePath) return `${params.apiBasePath}/pdf`
  if (!params.orgSlug) return null

  return params.userId
    ? `/api/${params.orgSlug}/business/users/${params.userId}/analytics/pdf`
    : `/api/${params.orgSlug}/business-user/analytics/pdf`
}

/** Nombre propuesto por el servidor; el del documento reutilizado manda. */
function resolveFileName(response: Response): string {
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = /filename="([^"]+)"/.exec(disposition)

  return match?.[1] ?? 'estadisticas.pdf'
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    return payload.error ?? 'Error al generar el informe'
  } catch {
    return 'Error al generar el informe'
  }
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
