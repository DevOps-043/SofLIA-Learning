import type { Metadata } from 'next'

import { AdminSecurityPage } from '@/features/admin/components/AdminSecurityPage'

export const metadata: Metadata = {
  title: 'Security | SofLIA',
  description: 'Security audit dashboard for SofLIA administrators.',
}

export default function SecurityPage() {
  return <AdminSecurityPage />
}
