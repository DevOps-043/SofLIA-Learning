import React from 'react'
import { LiaSidePanel } from '@/core/components/LiaSidePanel'
import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton'

export default function BusinessUserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <LiaSidePanel />
      <LiaFloatingButton />
    </>
  )
}
