export function buildLearnDataQuery(params: {
  lessonId?: string | null
  language: string
  organizationId?: string | null
}): string {
  const queryParams = new URLSearchParams()

  if (params.lessonId) {
    queryParams.append('lessonId', params.lessonId)
  }

  queryParams.append('language', params.language)

  if (params.organizationId) {
    queryParams.append('orgId', params.organizationId)
  }

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}
