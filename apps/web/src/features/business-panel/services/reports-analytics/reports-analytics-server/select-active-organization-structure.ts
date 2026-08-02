import type { OrganizationStructureRecord } from './active-organization-hierarchy'

/**
 * Mirrors the hierarchy editor: the default structure wins and, when an old
 * organization has no default yet, the first structure by name is in use.
 */
export function selectActiveOrganizationStructure(
  structures: OrganizationStructureRecord[],
): OrganizationStructureRecord | null {
  return [...structures].sort((left, right) => {
    const defaultDifference = Number(Boolean(right.is_default)) - Number(Boolean(left.is_default))
    if (defaultDifference !== 0) return defaultDifference

    const nameDifference = left.name.localeCompare(right.name, 'es', { sensitivity: 'base' })
    return nameDifference !== 0 ? nameDifference : left.id.localeCompare(right.id)
  })[0] || null
}
