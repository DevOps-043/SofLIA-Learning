'use client'

import { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import Image from 'next/image'
import { ThemeToggle } from '../../core/components/ThemeToggle/ThemeToggle'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  OnboardingChoiceScreen,
  CreateCompanyForm,
  JoinCompanyForm,
  PendingCompanyScreen,
  PendingJoinScreen,
  RejectedScreen,
  ApprovedRedirect,
  SuspendedScreen,
  useOnboardingStatus,
} from '../../features/onboarding'

type View = 'choice' | 'create' | 'join'

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const { status, organizationSlug, organizationName, banReason, isLoading: statusLoading, refetch } = useOnboardingStatus()
  const [view, setView] = useState<View>('choice')
  const [dismissedRejection, setDismissedRejection] = useState(false)

  // Dismiss the JARVIS onboarding tour so it doesn't overlay our org onboarding
  useEffect(() => {
    try {
      localStorage.setItem('has-seen-onboarding', 'true')
    } catch { /* ignore */ }
  }, [])

  if (loading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleFormSuccess = () => {
    setDismissedRejection(false)
    refetch()
  }

  const handleTryAgain = () => {
    setDismissedRejection(true)
    setView('choice')
  }

  const renderContent = () => {
    // Check status from API first
    if (status === 'banned') {
      return <SuspendedScreen type="banned" banReason={banReason} />
    }
    if (status === 'suspended') {
      return <SuspendedScreen type="suspended" organizationName={organizationName} />
    }
    if (status === 'pending_company') {
      return <PendingCompanyScreen organizationName={organizationName} />
    }
    if (status === 'pending_join') {
      return <PendingJoinScreen organizationName={organizationName} />
    }
    if (status === 'rejected' && !dismissedRejection) {
      return <RejectedScreen organizationName={organizationName} onTryAgain={handleTryAgain} />
    }
    if (status === 'approved') {
      return <ApprovedRedirect organizationSlug={organizationSlug} />
    }

    // status === 'none' — show the onboarding flow
    switch (view) {
      case 'create':
        return (
          <CreateCompanyForm
            userEmail={user?.email}
            onBack={() => setView('choice')}
            onSuccess={handleFormSuccess}
          />
        )
      case 'join':
        return (
          <JoinCompanyForm
            onBack={() => setView('choice')}
            onSuccess={handleFormSuccess}
          />
        )
      default:
        return (
          <OnboardingChoiceScreen
            onCreateCompany={() => setView('create')}
            onJoinCompany={() => setView('join')}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/Logo.png"
              alt="SofLIA"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">SofLIA</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {user && (
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
                <div className="w-8 h-8 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-sm font-bold">
                  {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-gray-600 dark:text-gray-300 text-sm hidden sm:block pr-2">
                  {user.email}
                </span>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 border border-gray-200 dark:border-white/5 hover:border-red-200 dark:hover:border-red-500/20 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {renderContent()}
      </main>
    </div>
  )
}
