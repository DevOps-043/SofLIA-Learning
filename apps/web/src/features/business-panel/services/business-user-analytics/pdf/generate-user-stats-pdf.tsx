import type {
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'
import { getUserStatsPdfCopy } from './user-stats-pdf-copy'

export interface GenerateUserStatsPdfOptions {
  userLabel: string
  organizationLabel?: string | null
  locale: BusinessUserAnalyticsLocale
  insights?: BusinessUserAnalyticsInsights | null
}

function localeTag(locale: BusinessUserAnalyticsLocale): string {
  return locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES'
}

/**
 * Genera el PDF branded de estadísticas de un usuario con `@react-pdf/renderer`.
 * Tanto la librería como el documento se importan de forma DINÁMICA para no cargar
 * react-pdf en el panel hasta que el usuario exporta (y para mantenerlo fuera del SSR).
 */
export async function generateUserStatsPdf(
  response: BusinessUserAnalyticsResponse,
  options: GenerateUserStatsPdfOptions,
): Promise<Blob> {
  const copy = getUserStatsPdfCopy(options.locale)
  const tag = localeTag(options.locale)

  const [{ pdf }, { UserStatsPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./UserStatsPdfDocument'),
  ])

  const generatedAtValue = new Date(response.generatedAt).toLocaleString(tag)
  const periodValue = `${new Date(response.period.from).toLocaleDateString(tag)} - ${new Date(
    response.period.to,
  ).toLocaleDateString(tag)}`

  return pdf(
    <UserStatsPdfDocument
      response={response}
      copy={copy}
      userLabel={options.userLabel}
      organizationLabel={options.organizationLabel}
      generatedAtValue={generatedAtValue}
      periodValue={periodValue}
      insights={options.insights}
    />,
  ).toBlob()
}
