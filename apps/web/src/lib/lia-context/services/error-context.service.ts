import type { ConsoleError } from '../types'
import { buildErrorContext } from './error-context/error-context.builder'
import {
  getBugStatsForPage,
} from './error-context/error-context.stats'
import {
  getOpenBugsForPage,
  getSimilarBugs,
  getUserRecentBugs,
} from './error-context/error-context.queries'
import {
  searchBugsByKeywords,
} from './error-context/error-context.search'
import type { SimilarBug, UserError } from './error-context/error-context.types'

export type { SimilarBug, UserError }

export class ErrorContextService {
  static async getSimilarBugs(currentPage: string, limit: number = 5): Promise<SimilarBug[]> {
    return getSimilarBugs(currentPage, limit)
  }

  static async getUserRecentBugs(userId: string, limit: number = 3): Promise<SimilarBug[]> {
    return getUserRecentBugs(userId, limit)
  }

  static async getOpenBugsForPage(currentPage: string): Promise<SimilarBug[]> {
    return getOpenBugsForPage(currentPage)
  }

  static async buildErrorContext(
    userId?: string,
    currentPage?: string,
    recentErrors?: ConsoleError[] | UserError[],
  ): Promise<string> {
    return buildErrorContext({
      currentPage,
      getOpenBugsForPage,
      getSimilarBugs,
      getUserRecentBugs,
      recentErrors,
      userId,
    })
  }

  static async searchBugsByKeywords(keywords: string[], limit: number = 5): Promise<SimilarBug[]> {
    return searchBugsByKeywords(keywords, limit)
  }

  static async getBugStatsForPage(currentPage: string): Promise<{
    total: number
    open: number
    resolved: number
    byCategory: Record<string, number>
  }> {
    return getBugStatsForPage(currentPage)
  }
}
