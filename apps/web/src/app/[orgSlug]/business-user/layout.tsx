import React from 'react'
import { LiaPanelMount } from '@/core/components/LiaSidePanel/LiaPanelMount'

export default function BusinessUserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <LiaPanelMount />
    </>
  )
}
