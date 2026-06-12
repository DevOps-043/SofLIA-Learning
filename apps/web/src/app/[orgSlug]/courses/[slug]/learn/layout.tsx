'use client'

import type { ReactNode } from 'react'

import { LiaCourseProvider } from '@/features/courses/context/LiaCourseContext'

export default function OrganizationLearnLayout({
  children,
}: {
  children: ReactNode
}) {
  return <LiaCourseProvider>{children}</LiaCourseProvider>
}
