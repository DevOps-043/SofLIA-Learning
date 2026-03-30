import { createClient } from '../../../lib/supabase/client'

export interface AdminApp {
  app_id: string
  name: string
  slug: string
  description: string
  long_description: string
  category_id: string
  website_url: string
  logo_url: string
  pricing_model: string
  pricing_details: any
  features: string[]
  use_cases: string[]
  advantages: string[]
  disadvantages: string[]
  alternatives: string[]
  tags: string[]
  supported_languages: string[]
  integrations: string[]
  api_available: boolean
  mobile_app: boolean
  desktop_app: boolean
  browser_extension: boolean
  is_featured: boolean
  is_verified: boolean
  view_count: number
  like_count: number
  rating: number
  rating_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Relaciones
  ai_categories?: {
    category_id: string
    name: string
    slug: string
    description: string
    icon: string
    color: string
  }
}

export interface AdminCategory {
  category_id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AppStats {
  totalApps: number
  activeApps: number
  featuredApps: number
  totalLikes: number
  totalViews: number
  averageRating: number
  verifiedApps: number
}

export class AdminAppsService {
  static async getApps(): Promise<AdminApp[]> {
    try {
      const response = await fetch('/api/admin/apps')
      
      if (!response.ok) {
        throw new Error('Failed to fetch apps')
      }

      const data = await response.json()
      return data.apps || []
    } catch (error) {
      throw error
    }
  }

  static async getCategories(): Promise<AdminCategory[]> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('ai_categories')
        .select(`
          category_id,
          name,
          slug,
          description,
          icon,
          color,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      throw error
    }
  }

  static async getAppStats(): Promise<AppStats> {
    try {
      const response = await fetch('/api/admin/apps/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch app stats')
      }

      const data = await response.json()
      return data.stats
    } catch (error) {
      throw error
    }
  }

  static async createApp(appData: Partial<AdminApp>, adminUserId: string): Promise<AdminApp> {
    try {
      const response = await fetch('/api/admin/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appData)
      })

      if (!response.ok) {
        throw new Error('Failed to create app')
      }

      const data = await response.json()
      return data.app
    } catch (error) {
      throw error
    }
  }

  static async updateApp(appId: string, appData: Partial<AdminApp>): Promise<AdminApp> {
    try {
      const response = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appData)
      })

      if (!response.ok) {
        throw new Error('Failed to update app')
      }

      const data = await response.json()
      return data.app
    } catch (error) {
      throw error
    }
  }

  static async deleteApp(appId: string): Promise<void> {
    try {
      const response = await fetch(`/api/admin/apps/${appId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete app')
      }

      } catch (error) {
      throw error
    }
  }

  static async toggleAppStatus(appId: string, isActive: boolean): Promise<AdminApp> {
    try {
      const response = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle app status')
      }

      const data = await response.json()
      return data.app
    } catch (error) {
      throw error
    }
  }

  static async toggleAppFeatured(appId: string, isFeatured: boolean): Promise<AdminApp> {
    try {
      const response = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_featured: isFeatured })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle app featured')
      }

      const data = await response.json()
      return data.app
    } catch (error) {
      throw error
    }
  }

  static async toggleAppVerified(appId: string, isVerified: boolean): Promise<AdminApp> {
    try {
      const response = await fetch(`/api/admin/apps/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_verified: isVerified })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle app verified')
      }

      const data = await response.json()
      return data.app
    } catch (error) {
      throw error
    }
  }
}
