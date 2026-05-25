'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { UserStatsLoadingState } from './shared/UserStatsLoadingState'
import { UserProgressCourseCard } from './progress-modal/UserProgressCourseCard'
import { UserProgressEmptyState } from './progress-modal/UserProgressEmptyState'
import { UserProgressModalHeader } from './progress-modal/UserProgressModalHeader'
import { UserProgressSidebar } from './progress-modal/UserProgressSidebar'
import { useUserProgressData } from './progress-modal/useUserProgressData'
import type { UserDetail } from './types'

interface UserProgressModalProps {
  user: UserDetail
  isOpen: boolean
  onClose: () => void
}

export function UserProgressModal({ user, isOpen, onClose }: UserProgressModalProps) {
  const theme = useAdminPanelTheme()
  const { data, isLoading } = useUserProgressData(user.id, isOpen)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-[28px] border shadow-2xl transition-all" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
                <div className="flex max-h-[88vh] flex-col md:flex-row">
                  <UserProgressSidebar user={user} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <UserProgressModalHeader coursesCount={data?.courses?.length ?? 0} onClose={onClose} />
                    <div className="flex-1 space-y-4 overflow-y-auto p-6">{isLoading ? <UserStatsLoadingState /> : null}{!isLoading && !data?.courses?.length ? <UserProgressEmptyState /> : null}{!isLoading ? data?.courses?.map((course) => <UserProgressCourseCard key={course.enrollmentId} course={course} />) : null}</div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
