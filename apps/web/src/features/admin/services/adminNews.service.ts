import { createClient } from '../../../lib/supabase/client'

export interface AdminNews {
  id: string
  title: string
  slug: string
  subtitle?: string
  language: string
  hero_image_url?: string
  tldr?: any
  intro?: string
  sections?: any
  metrics?: any
  links?: any
  cta?: any
  status: string
  published_at?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface NewsStats {
  totalNews: number
  publishedNews: number
  draftNews: number
  archivedNews: number
  totalViews: number
  totalComments: number
  averageViews: number
}

export class AdminNewsService {
  static async getNews(): Promise<AdminNews[]> {
    try {
      const response = await fetch('/api/admin/news', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()
      return data.news || []
    } catch (error) {
      throw error
    }
  }

  static async getNewsStats(): Promise<NewsStats> {
    try {
      const response = await fetch('/api/admin/news/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news stats')
      }

      const data = await response.json()
      return data.stats
    } catch (error) {
      throw error
    }
  }

  static async createNews(newsData: Partial<AdminNews>, adminUserId: string): Promise<AdminNews> {
    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsData)
      })

      if (!response.ok) {
        throw new Error('Failed to create news')
      }

      const data = await response.json()
      return data.news
    } catch (error) {
      throw error
    }
  }

  static async updateNews(newsId: string, newsData: Partial<AdminNews>): Promise<AdminNews> {
    try {
      const response = await fetch(`/api/admin/news/${newsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsData)
      })

      if (!response.ok) {
        throw new Error('Failed to update news')
      }

      const data = await response.json()
      return data.news
    } catch (error) {
      throw error
    }
  }

  static async deleteNews(newsId: string): Promise<void> {
    try {
      const response = await fetch(`/api/admin/news/${newsId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete news')
      }

      } catch (error) {
      throw error
    }
  }

  static async toggleNewsStatus(newsId: string, status: 'draft' | 'published' | 'archived'): Promise<void> {
    try {
      const response = await fetch(`/api/admin/news/${newsId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle news status')
      }

      } catch (error) {
      throw error
    }
  }

  static async getNewsById(newsId: string): Promise<AdminNews> {
    try {
      const response = await fetch(`/api/admin/news/${newsId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const data = await response.json()
      return data.news
    } catch (error) {
      throw error
    }
  }
}
