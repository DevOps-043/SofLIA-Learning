export interface FeaturedReel {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration_seconds: number
  category: string
  view_count: number
  like_count: number
  share_count: number
  comment_count: number
  created_at: string
}

export class ReelsService {
  private static baseUrl = '/api/reels'

  static async getFeaturedReels(limit: number = 6): Promise<FeaturedReel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/featured?limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch featured reels')
      }
      return await response.json()
    } catch (error) {
      return []
    }
  }

  static async getAllReels(): Promise<FeaturedReel[]> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch reels')
      }
      return await response.json()
    } catch (error) {
      return []
    }
  }
}
