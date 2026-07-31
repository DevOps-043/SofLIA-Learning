import 'server-only'

import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'

import { getUserStatsPdfCopy } from './user-stats-pdf-copy'

export interface RenderUserStatsPdfOptions {
  userLabel: string
  organizationLabel?: string | null
  locale: BusinessUserAnalyticsLocale
  insights?: BusinessUserAnalyticsInsights | null
}

function localeTag(locale: BusinessUserAnalyticsLocale): string {
  return locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES'
}

/**
 * Renderiza el PDF de estadísticas de un usuario y devuelve sus bytes.
 *
 * Se genera en el servidor —antes se hacía en el navegador— porque es lo que
 * permite guardarlo y reutilizarlo durante el día; si lo produjera el cliente,
 * cada descarga volvería a pedir el análisis a SofLIA.
 */
export async function renderUserStatsPdf(
  response: BusinessUserAnalyticsResponse,
  options: RenderUserStatsPdfOptions,
): Promise<Uint8Array> {
  const copy = getUserStatsPdfCopy(options.locale)
  const tag = localeTag(options.locale)

  const [{ renderToBuffer }, { UserStatsPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./UserStatsPdfDocument'),
  ])

  const generatedAtValue = new Date(response.generatedAt).toLocaleString(tag)
  const periodValue = `${new Date(response.period.from).toLocaleDateString(tag)} - ${new Date(
    response.period.to,
  ).toLocaleDateString(tag)}`

  const buffer = await renderToBuffer(
    <UserStatsPdfDocument
      response={response}
      copy={copy}
      userLabel={options.userLabel}
      organizationLabel={options.organizationLabel}
      generatedAtValue={generatedAtValue}
      periodValue={periodValue}
      insights={options.insights}
    />,
  )

  return new Uint8Array(buffer)
}
