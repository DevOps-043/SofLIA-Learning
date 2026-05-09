'use client'

import { Bars3Icon } from '@heroicons/react/24/outline'
import { UserDropdown } from '@/core/components/UserDropdown'
import { useInstructorUser } from '../hooks/useInstructorUser'

interface InstructorHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function InstructorHeader({ onMenuClick, title }: InstructorHeaderProps) {
  const { user, isLoading } = useInstructorUser()

  return (
    <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 shadow-lg border-b border-purple-700/50 w-full backdrop-blur-sm relative z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-purple-200 hover:text-white hover:bg-purple-700/50 transition-all duration-200 hover:scale-110"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0 flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                {title}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-700/50 rounded-full animate-pulse"></div>
                <div className="hidden md:block">
                  <div className="w-20 h-4 bg-purple-700/50 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-purple-700/50 rounded animate-pulse"></div>
                </div>
              </div>
            ) : user ? (
              <UserDropdown user={user} />
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-700/50 rounded-full"></div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-purple-200">
                    Usuario no encontrado
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

