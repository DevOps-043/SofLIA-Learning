export function resolveStudyPlannerOrgSlug(params: {
  fromOrgSlug: string | null
  userOrgSlug?: string | null
  orgSlugParam?: string | string[] | null
}): string | null {
  if (params.fromOrgSlug) {
    return params.fromOrgSlug
  }

  if (params.userOrgSlug) {
    return params.userOrgSlug
  }

  if (typeof params.orgSlugParam === 'string') {
    return params.orgSlugParam
  }

  if (Array.isArray(params.orgSlugParam)) {
    return params.orgSlugParam[0] || null
  }

  return null
}
