import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'
import { CertificateRecord } from './certificate-record'
import { logQueryError } from './log-query-error'
import { PAGE_LIMIT } from './page_limit'

export async function fetchCertificates(
  supabase: BusinessUserAnalyticsSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from('user_course_certificates')
    .select('certificate_id, enrollment_id, course_id, organization_id')
    .eq('user_id', userId)
    .limit(PAGE_LIMIT)
    .returns<CertificateRecord[]>()

  logQueryError('business user certificates', error)
  return data || []
}
