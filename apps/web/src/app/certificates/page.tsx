'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentOrganizationSlug } from '@/core/stores/organizationStore'

/**
 * Legacy /certificates route — redirects to the org-scoped certificates page.
 * The org-scoped page filters by organization and provides the org-branded navbar.
 */
export default function CertificatesRedirectPage() {
  const router = useRouter()
  const orgSlug = useCurrentOrganizationSlug()

  useEffect(() => {
    if (orgSlug) {
      router.replace(`/${orgSlug}/certificates`)
    } else {
      // No org context yet (store not hydrated) — wait a tick
      const timer = setTimeout(() => {
        if (orgSlug) {
          router.replace(`/${orgSlug}/certificates`)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [orgSlug, router])

  return null
}
