// Community-level business policy constants.
// These values are defined by product rules, not technical configuration.
// A change here affects access checks, member filtering, and auto-join logic
// across all community API routes — update with care.

/** Slug of the community that enforces single-membership exclusivity. */
export const PROFESIONALES_COMMUNITY_SLUG = 'profesionales'

/** A user may not belong to 'profesionales' and any other community simultaneously. */
export const SINGLE_MEMBERSHIP_SLUGS = new Set([PROFESIONALES_COMMUNITY_SLUG])

export function isSingleMembershipCommunity(slug: string): boolean {
  return SINGLE_MEMBERSHIP_SLUGS.has(slug)
}
