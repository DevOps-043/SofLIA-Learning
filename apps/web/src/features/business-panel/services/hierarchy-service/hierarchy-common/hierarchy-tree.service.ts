import type { HierarchyTree } from '../../../types/hierarchy.types'
import { fetchApi } from './hierarchy-api'
import {
  EMPTY_HIERARCHY,
  type HierarchySummary,
} from './hierarchy-common.types'

const EMPTY_SUMMARY: HierarchySummary = {
  regions: [],
  zones: [],
  teams: [],
}

export async function getFullHierarchy(orgSlug?: string): Promise<HierarchyTree> {
  const result = await fetchApi<HierarchyTree>('/full', {}, orgSlug)
  return result.success && result.data ? result.data : EMPTY_HIERARCHY
}

export async function getHierarchySummary(orgSlug?: string): Promise<HierarchySummary> {
  const result = await fetchApi<HierarchySummary>('/summary', {}, orgSlug)
  return result.success && result.data ? result.data : EMPTY_SUMMARY
}
