import type { ApiResponse } from './hierarchy-common.types'

export const getApiBase = (orgSlug?: string) =>
  orgSlug ? `/api/${orgSlug}/business/hierarchy` : '/api/business/hierarchy'

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  orgSlug?: string,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${getApiBase(orgSlug)}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Error ${response.status}`,
      }
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message,
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    }
  }
}
