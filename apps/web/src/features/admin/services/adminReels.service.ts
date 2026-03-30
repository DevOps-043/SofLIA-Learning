export interface AdminReel {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration_seconds: number
  category: string
  language: string
  is_featured: boolean
  is_active: boolean
  view_count: number
  like_count: number
  share_count: number
  comment_count: number
  created_by: string
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface AdminReelStats {
  totalReels: number
  activeReels: number
  featuredReels: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalComments: number
  growthPercentage: number
}

export interface CreateReelData {
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration_seconds: number
  category: string
  language: string
  is_featured: boolean
  is_active: boolean
  created_by: string
  published_at?: string
}

export interface UpdateReelData {
  title?: string
  description?: string
  video_url?: string
  thumbnail_url?: string
  duration_seconds?: number
  category?: string
  language?: string
  is_featured?: boolean
  is_active?: boolean
  published_at?: string
}

export class AdminReelsService {
  private static baseUrl = '/api/admin/reels'

  static async getReels(): Promise<AdminReel[]> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch reels')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  static async getReel(id: string): Promise<AdminReel> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reel')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  static async createReel(data: CreateReelData): Promise<AdminReel> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to create reel')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  static async updateReel(id: string, data: UpdateReelData): Promise<AdminReel> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to update reel')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  static async deleteReel(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete reel')
      }
    } catch (error) {
      throw error
    }
  }

  static async toggleReelStatus(id: string): Promise<AdminReel> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/status`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to toggle reel status')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  static async toggleReelFeatured(id: string): Promise<AdminReel> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/featured`, {
        method: 'PATCH',
      })
      if (!response.ok) {
        throw new Error('Failed to toggle reel featured')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  static async getStats(): Promise<AdminReelStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch reel stats')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }

  static async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`)
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      return await response.json()
    } catch (error) {
      throw error
    }
  }
}
