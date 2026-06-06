'use client'

import type React from 'react'
import dynamic from 'next/dynamic'
import type { NotesModalProps } from '@/core/components/NotesModal'
import type { CourseLia } from '@/features/courses/components/CourseLia'

const NotesModal = dynamic(
  () => import('@/core/components/NotesModal/NotesModalPdfMake').then((mod) => ({ default: mod.NotesModalPdfMake })),
  { loading: () => <div className="flex items-center justify-center p-8">Cargando notas...</div>, ssr: false },
)

// CourseLia es el asistente IA flotante: client-only (renderiza via portal tras
// montar) y no critico para la lectura de la leccion. Se carga de forma diferida
// (ssr: false) para sacar su arbol (chat, markdown, voz/TTS) del bundle inicial
// de la pagina de aprendizaje, que es la mas visitada.
const CourseLiaDynamic = dynamic(
  () => import('@/features/courses/components/CourseLia').then((mod) => ({ default: mod.CourseLia })),
  { ssr: false },
)

export const NotesModalComponent = NotesModal as unknown as (
  props: NotesModalProps,
) => React.ReactElement | null

export const CourseLiaComponent = CourseLiaDynamic as unknown as (
  props: React.ComponentProps<typeof CourseLia>,
) => React.ReactElement | null
