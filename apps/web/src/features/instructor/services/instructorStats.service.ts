// Este archivo solo contiene interfaces y métodos del cliente
// Para métodos del servidor, ver instructorStats.server.service.ts

export interface InstructorStats {
  totalCourses: number
  totalStudents: number
  totalReels: number
  averageRating: number
  totalHours: number
  coursesThisMonth: number
  studentsThisMonth: number
  reelsThisMonth: number
}

// Interfaces para estadísticas detalladas
export interface HRStats {
  usersByCountry: Array<{ country: string; count: number }>
  registrationsByDate: Array<{ date: string; count: number }>
  demographics: {
    byRole: Record<string, number>
    byLevel: Record<string, number>
    byArea: Record<string, number>
    bySector: Record<string, number>
    byCompanySize: Record<string, number>
    byRelation: Record<string, number>
    verifiedUsers: number
  }
}

export interface CourseMetrics {
  totalCourses: number
  totalStudents: number
  averageRating: number
  totalRevenue: number
  studentsByCourse: Array<{ courseId: string; courseTitle: string; studentCount: number }>
  progressByCourse: Array<{ courseId: string; courseTitle: string; averageProgress: number }>
  completionByCourse: Array<{ courseId: string; courseTitle: string; completionRate: number }>
  ratingsByCourse: Array<{ courseId: string; courseTitle: string; averageRating: number }>
  revenueByCourse: Array<{ courseId: string; courseTitle: string; revenue: number }>
  enrollmentsByDate: Record<string, number>
}

export interface CommunityMetrics {
  totalCommunities: number
  totalMembers: number
  totalPosts: number
  totalComments: number
  membersByCommunity: Array<{ communityId: string; communityName: string; memberCount: number }>
  postsByCommunity: Array<{ communityId: string; communityName: string; postCount: number }>
  commentsByCommunity: Array<{ communityId: string; communityName: string; commentCount: number }>
  activityByCommunity: Array<{ communityId: string; communityName: string; activityScore: number }>
  pointsByCommunity: Array<{ communityId: string; communityName: string; totalPoints: number }>
  activityByDate: Record<string, { posts: number; comments: number }>
}

export interface NewsMetrics {
  totalNews: number
  publishedNews: number
  totalViews: number
  totalComments: number
  viewsByDate: Record<string, number>
  commentsByDate: Record<string, number>
  engagementByNews: Array<{ newsId: string; newsTitle: string; views: number; comments: number; engagementRate: number }>
  topNews: Array<{ newsId: string; newsTitle: string; views: number }>
}

export interface ReelMetrics {
  totalReels: number
  activeReels: number
  totalViews: number
  totalLikes: number
  totalShares: number
  totalComments: number
  viewsByDate: Record<string, number>
  likesByDate: Record<string, number>
  engagementByReel: Array<{ reelId: string; reelTitle: string; views: number; likes: number; shares: number; comments: number; engagementRate: number }>
  topReels: Array<{ reelId: string; reelTitle: string; views: number }>
}

export interface DetailedInstructorStats {
  period: string
  dateRange: {
    start: string
    end: string
  }
  hr: HRStats
  courses: CourseMetrics
  communities: CommunityMetrics
  news: NewsMetrics
  reels: ReelMetrics
}

export class InstructorStatsService {
  /**
   * Obtiene estadísticas detalladas del instructor incluyendo RRHH, cursos, comunidades, noticias y reels
   * Este método debe ser llamado desde el cliente (client-side)
   */
  static async getDetailedStats(period: string = '1month'): Promise<DetailedInstructorStats> {
    try {
      // Solo usar fetch si estamos en el cliente
      if (typeof window === 'undefined') {
        throw new Error('getDetailedStats debe ser llamado desde el cliente')
      }

      const response = await fetch(`/api/instructor/stats/detailed?period=${period}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  }
}

