import type { Metadata } from 'next'

import { StatusPageClient } from './StatusPageClient'

export const metadata: Metadata = {
  title: 'Estado del sistema | SofLIA Learning',
  description: 'Estado operativo de los servicios de SofLIA Learning.',
}

export default function StatusPage() {
  return <StatusPageClient />
}
