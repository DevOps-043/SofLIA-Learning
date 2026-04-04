'use client'

import { useAdminStats } from '../../hooks/useAdminStats'
import {
  UsersIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

interface StatCard {
  id: string
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: typeof UsersIcon
  color: string
}

export function StatsCardsWidget() {
  const { stats: dbStats, isLoading } = useAdminStats()

  const stats: StatCard[] = dbStats
    ? [
        {
          id: 'total-users',
          title: 'Usuarios Totales',
          value: dbStats.totalUsers.toLocaleString(),
          change: `${dbStats.userGrowth >= 0 ? '+' : ''}${dbStats.userGrowth}%`,
          changeType: dbStats.userGrowth >= 0 ? 'increase' : 'decrease',
          icon: UsersIcon,
          color: 'blue'
        },
        {
          id: 'active-courses',
          title: 'Cursos Activos',
          value: dbStats.activeCourses.toLocaleString(),
          change: `${dbStats.courseGrowth >= 0 ? '+' : ''}${dbStats.courseGrowth}%`,
          changeType: dbStats.courseGrowth >= 0 ? 'increase' : 'decrease',
          icon: BookOpenIcon,
          color: 'green'
        },
        {
          id: 'communities',
          title: 'Comunidades',
          value: '0',
          change: '+0%',
          changeType: 'increase',
          icon: UserGroupIcon,
          color: 'purple'
        },
        {
          id: 'ai-apps',
          title: 'Apps de IA',
          value: dbStats.totalAIApps.toLocaleString(),
          change: `${dbStats.aiAppGrowth >= 0 ? '+' : ''}${dbStats.aiAppGrowth}%`,
          changeType: dbStats.aiAppGrowth >= 0 ? 'increase' : 'decrease',
          icon: CpuChipIcon,
          color: 'orange'
        },
        {
          id: 'prompts',
          title: 'Prompts',
          value: '0',
          change: '+0%',
          changeType: 'increase',
          icon: ChatBubbleLeftRightIcon,
          color: 'red'
        },
        {
          id: 'news',
          title: 'Noticias',
          value: dbStats.totalNews.toLocaleString(),
          change: `${dbStats.newsGrowth >= 0 ? '+' : ''}${dbStats.newsGrowth}%`,
          changeType: dbStats.newsGrowth >= 0 ? 'increase' : 'decrease',
          icon: NewspaperIcon,
          color: 'indigo'
        }
      ]
    : []

  const getColorClasses = (color: string, changeType: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        icon: 'text-orange-600 dark:text-orange-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        change: changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const colors = getColorClasses(stat.color, stat.changeType)
        return (
          <div
            key={stat.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${colors.bg}`}>
                <stat.icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <div className="flex items-center ml-2">
                    {stat.changeType === 'increase' ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 dark:text-red-400 mr-1" />
                    )}
                    <p className={`text-sm font-medium ${colors.change}`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
