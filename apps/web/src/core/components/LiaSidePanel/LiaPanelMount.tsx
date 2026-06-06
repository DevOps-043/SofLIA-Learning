'use client'

import dynamic from 'next/dynamic'

/**
 * Monta el asistente IA flotante (panel + boton) de forma DIFERIDA.
 *
 * `LiaSidePanel`/`LiaFloatingButton` son client-only y no son criticos para el
 * contenido de la pagina (es un asistente flotante con su propio estado de
 * apertura). Cargarlos con `ssr: false` los saca del First Load de cada pagina/
 * layout que los monta (business-user, certificados, etc.) y se hidratan despues.
 *
 * Como `next/dynamic` con `ssr: false` no se permite en Server Components, este
 * wrapper cliente puede importarse desde layouts de servidor sin convertirlos.
 */
const LiaSidePanel = dynamic(
  () => import('./LiaSidePanel').then((mod) => ({ default: mod.LiaSidePanel })),
  { ssr: false },
)

const LiaFloatingButton = dynamic(
  () => import('./LiaFloatingButton').then((mod) => ({ default: mod.LiaFloatingButton })),
  { ssr: false },
)

export function LiaPanelMount() {
  return (
    <>
      <LiaSidePanel />
      <LiaFloatingButton />
    </>
  )
}
