'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

interface InstructorStats {
  totalCourses: number
  totalStudents: number
  totalReels: number
  averageRating: number
  totalHours: number
  coursesThisMonth: number
  studentsThisMonth: number
  reelsThisMonth: number
}

export function InstructorDashboard() {
  const { t } = useTranslation('instructor')

  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalReels: 0,
    averageRating: 0,
    totalHours: 0,
    coursesThisMonth: 0,
    studentsThisMonth: 0,
    reelsThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/instructor/stats')
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setStats(data)
      } catch (error) {
        setError(t('dashboard.error'))
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = useMemo(() => [
    {
      name: t('dashboard.stats.courses'),
      value: stats.totalCourses,
      icon: BookOpenIcon,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      change: stats.coursesThisMonth > 0 ? t('dashboard.stats.thisMonth', { count: stats.coursesThisMonth }) : t('dashboard.stats.noChanges')
    },
    {
      name: t('dashboard.stats.students'),
      value: stats.totalStudents,
      icon: UserGroupIcon,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      change: stats.studentsThisMonth > 0 ? t('dashboard.stats.thisMonth', { count: stats.studentsThisMonth }) : t('dashboard.stats.noChanges')
    },
    {
      name: t('dashboard.stats.reels'),
      value: stats.totalReels,
      icon: VideoCameraIcon,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      change: stats.reelsThisMonth > 0 ? t('dashboard.stats.thisMonth', { count: stats.reelsThisMonth }) : t('dashboard.stats.noChanges')
    },
    {
      name: t('dashboard.stats.rating'),
      value: stats.averageRating.toFixed(1),
      icon: TrophyIcon,
      color: 'from-amber-500 to-yellow-500',
      bgColor: 'bg-amber-500/10',
      change: t('dashboard.stats.overallAverage'),
      suffix: '/ 5.0'
    },
    {
      name: t('dashboard.stats.hours'),
      value: stats.totalHours,
      icon: ClockIcon,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      change: t('dashboard.stats.totalAccumulated')
    }
  ], [stats, t])

  const quickActions = useMemo(() => [
    { name: t('dashboard.actions.createCourse.title'), description: t('dashboard.actions.createCourse.desc'), icon: BookOpenIcon, color: 'from-blue-500 to-cyan-500', href: '/instructor/courses/new' },
    { name: t('dashboard.actions.manageWorkshops.title'), description: t('dashboard.actions.manageWorkshops.desc'), icon: AcademicCapIcon, color: 'from-purple-500 to-pink-500', href: '/instructor/workshops' },
    { name: t('dashboard.actions.uploadReel.title'), description: t('dashboard.actions.uploadReel.desc'), icon: VideoCameraIcon, color: 'from-green-500 to-emerald-500', href: '/instructor/reels/new' }
  ], [t])

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950/30 to-purple-950/30">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <p className="text-purple-300 text-lg font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950/30 to-purple-950/30">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-red-400 text-lg font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('dashboard.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 w-full min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/30 to-purple-950/30">
      <div className="w-full max-w-7xl mx-auto space-y-10">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-indigo-950/90 shadow-2xl border border-indigo-500/20 p-8 md:p-12 backdrop-blur-xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/10 via-orange-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                  <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                    <AcademicCapIcon className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
                    {t('dashboard.title')}
                  </h1>
                  <p className="text-indigo-200 text-base md:text-lg font-medium max-w-2xl">
                    {t('dashboard.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20">
                <ChartBarIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {t('dashboard.stats.title')}
              </h2>
            </div>
            <p className="text-indigo-300/70 ml-14 text-sm md:text-base">{t('dashboard.stats.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {/* Mostrar solo 5 tarjetas en lugar de 6 (eliminamos Talleres) */}
            {statCards.map((card: any, index: number) => (
              <div
                key={card.name}
                className={`
                  group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl
                  shadow-xl border border-gray-800/50 p-6
                  hover:border-gray-700/70 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer
                  animate-fade-in-up
                `}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${card.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <card.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 backdrop-blur-sm">
                      <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-green-400 text-xs font-semibold">{card.change}</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                      {card.value}
                      {card.suffix && <span className="text-xl text-gray-400 font-medium ml-1.5">{card.suffix}</span>}
                    </p>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{card.name}</p>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/20">
                <BoltIcon className="h-6 w-6 text-orange-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {t('dashboard.actions.title')}
              </h2>
            </div>
            <p className="text-indigo-300/70 ml-14 text-sm md:text-base">{t('dashboard.actions.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {quickActions.map((action: any, index: number) => (
              <a
                key={action.name}
                href={action.href}
                className={`
                  group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl
                  shadow-xl border border-gray-800/50 p-8
                  hover:border-gray-700/70 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer
                  animate-fade-in-up block
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Animated gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${action.color} opacity-5 rounded-full blur-3xl group-hover:opacity-15 group-hover:scale-150 transition-all duration-700`}></div>
                
                <div className="relative z-10">
                  <div className={`mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <action.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                    {action.name}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{action.description}</p>
                </div>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
