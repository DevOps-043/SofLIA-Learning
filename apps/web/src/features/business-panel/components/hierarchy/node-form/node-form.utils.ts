import type { OrganizationNode } from '../../../types/dynamicHierarchy.types'
import type { UserWithHierarchy } from '../../../types/hierarchy.types'

export type NodeManagerUser = UserWithHierarchy['user']

export interface GeocodeResponse {
  coordinates?: {
    lat: string | number
    lon: string | number
  }
  error?: string
  success?: boolean
}

export interface ReverseGeocodeAddress {
  city?: string
  country?: string
  house_number?: string
  municipality?: string
  neighbourhood?: string
  pedestrian?: string
  postcode?: string
  road?: string
  state?: string
  street?: string
  suburb?: string
  town?: string
  village?: string
}

export interface ReverseGeocodeResponse {
  address?: ReverseGeocodeAddress
  display_name?: string
  error?: string
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function toManagerUser(manager: OrganizationNode['manager']): NodeManagerUser | null {
  if (!manager) return null
  return {
    id: manager.id,
    first_name: manager.first_name,
    last_name: manager.last_name,
    email: manager.email,
    profile_picture_url: manager.profile_picture_url ?? null,
    username: manager.email,
  }
}
