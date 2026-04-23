export function buildLessonSupplementUrls(params: {
  lessonId: string
  organizationId?: string | null
  selectedLang: string
  slug: string
}) {
  const query = new URLSearchParams({ language: params.selectedLang })

  if (params.organizationId) {
    query.set('orgId', params.organizationId)
  }

  const baseUrl = `/api/courses/${params.slug}/lessons/${params.lessonId}`

  return {
    transcriptUrl: `${baseUrl}/transcript?${query.toString()}`,
    summaryUrl: `${baseUrl}/summary?${query.toString()}`,
  }
}
