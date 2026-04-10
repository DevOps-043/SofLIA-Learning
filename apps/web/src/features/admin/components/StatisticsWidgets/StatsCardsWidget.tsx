'use client'

import { useAdminStats } from '../../hooks/useAdminStats'
import { motion } from 'framer-motion'
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

interface StatCardData {
  id: string
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: typeof UsersIcon
  gradient: string
  shadow: string
}

export function StatsCardsWidget() {
  const { stats: dbStats, isLoading } = useAdminStats()

  const statsList: StatCardData[] = dbStats
    ? [
        {
          id: 'total-users',
          title: 'Usuarios Totales',
          value: dbStats.totalUsers.toLocaleString(),
          change: `${dbStats.userGrowth >= 0 ? '+' : ''}${dbStats.userGrowth}%`,
          changeType: dbStats.userGrowth >= 0 ? 'increase' : 'decrease',
          icon: UsersIcon,
          gradient: 'from-blue-500 to-blue-600',
          shadow: 'shadow-blue-500/20'
        },
        {
          id: 'active-courses',
          title: 'Cursos Activos',
          value: dbStats.activeCourses.toLocaleString(),
          change: `${dbStats.courseGrowth >= 0 ? '+' : ''}${dbStats.courseGrowth}%`,
          changeType: dbStats.courseGrowth >= 0 ? 'increase' : 'decrease',
          icon: BookOpenIcon,
          gradient: 'from-[#10B981] to-[#059669]',
          shadow: 'shadow-emerald-500/20'
        },
        {
          id: 'communities',
          title: 'Comunidades',
          value: '0',
          change: '+0%',
          changeType: 'increase',
          icon: UserGroupIcon,
          gradient: 'from-purple-500 to-indigo-600',
          shadow: 'shadow-purple-500/20'
        },
        {
          id: 'ai-apps',
          title: 'Apps de IA',
          value: dbStats.totalAIApps.toLocaleString(),
          change: `${dbStats.aiAppGrowth >= 0 ? '+' : ''}${dbStats.aiAppGrowth}%`,
          changeType: dbStats.aiAppGrowth >= 0 ? 'increase' : 'decrease',
          icon: CpuChipIcon,
          gradient: 'from-amber-500 to-orange-600',
          shadow: 'shadow-amber-500/20'
        },
        {
          id: 'prompts',
          title: 'Prompts',
          value: '0',
          change: '+0%',
          changeType: 'increase',
          icon: ChatBubbleLeftRightIcon,
          gradient: 'from-red-500 to-rose-600',
          shadow: 'shadow-red-500/20'
        },
        {
          id: 'news',
          title: 'Noticias',
          value: dbStats.totalNews.toLocaleString(),
          change: `${dbStats.newsGrowth >= 0 ? '+' : ''}${dbStats.newsGrowth}%`,
          changeType: dbStats.newsGrowth >= 0 ? 'increase' : 'decrease',
          icon: NewspaperIcon,
          gradient: 'from-indigo-500 to-blue-700',
          shadow: 'shadow-indigo-500/20'
        }
      ]
    : []

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsList.map((stat, index) => (
        <motion.div
           key={stat.id}
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: index * 0.05 }}
           whileHover={{ y: -5 }}
           className="relative group"
        >
          <div className="h-full bg-white dark:bg-[#1E2329] rounded-2xl border border-[#E9ECEF] dark:border-white/5 p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
             {/* Hover Glow */}
             <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-br ${stat.gradient}`} />
             
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  
                  <div 
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      stat.changeType === 'increase' 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {stat.changeType === 'increase' ? (
                      <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
                    )}
                    {stat.change}
                  </div>
                </div>

                <p className="text-sm font-semibold uppercase tracking-wider text-[#6C757D] dark:text-white/60 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-black text-[#0A2540] dark:text-white">
                  {stat.value}
                </p>
             </div>

             {/* Animated Bottom Line */}
             <motion.div 
                className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                initial={{ width: 0 }}
                whileHover={{ width: '33.33%' }}
                transition={{ duration: 0.5 }}
             />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

