'use client'

import type React from 'react'
import dynamic from 'next/dynamic'
import type { NotesModalProps } from '@/core/components/NotesModal'
import { CourseLia } from '@/features/courses/components/CourseLia'

const NotesModal = dynamic(
  () => import('@/core/components/NotesModal/NotesModalPdfMake').then((mod) => ({ default: mod.NotesModalPdfMake })),
  { loading: () => <div className="flex items-center justify-center p-8">Cargando notas...</div>, ssr: false },
)

export const NotesModalComponent = NotesModal as unknown as (
  props: NotesModalProps,
) => React.ReactElement | null

export const CourseLiaComponent = CourseLia as unknown as (
  props: React.ComponentProps<typeof CourseLia>,
) => React.ReactElement | null
