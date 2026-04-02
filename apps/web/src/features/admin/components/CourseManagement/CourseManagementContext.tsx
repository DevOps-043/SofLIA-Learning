'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { useCourseManagementLogic } from './hooks/useCourseManagementLogic'

type CourseManagementState = ReturnType<typeof useCourseManagementLogic>

interface CourseManagementContextValue {
  courseId: string
  state: CourseManagementState
}

const CourseManagementContext = createContext<CourseManagementContextValue | null>(null)

interface CourseManagementProviderProps {
  courseId: string
  state: CourseManagementState
  children: ReactNode
}

export function CourseManagementProvider({
  courseId,
  state,
  children,
}: CourseManagementProviderProps) {
  return (
    <CourseManagementContext.Provider value={{ courseId, state }}>
      {children}
    </CourseManagementContext.Provider>
  )
}

export function useCourseManagementContext() {
  const context = useContext(CourseManagementContext)

  if (!context) {
    throw new Error('useCourseManagementContext must be used within CourseManagementProvider')
  }

  return context
}
