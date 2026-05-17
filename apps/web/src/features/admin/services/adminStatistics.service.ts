import { getContentDistribution } from './admin-statistics/content-distribution.service'
import { getMonthlyGrowth } from './admin-statistics/monthly-growth.service'
import { getRecentActivity } from './admin-statistics/recent-activity.service'

export type {
  ContentDistribution,
  MonthlyGrowthData,
  RecentActivity,
} from './admin-statistics/types'

export class AdminStatisticsService {
  static getMonthlyGrowth = getMonthlyGrowth
  static getContentDistribution = getContentDistribution
  static getRecentActivity = getRecentActivity
}
