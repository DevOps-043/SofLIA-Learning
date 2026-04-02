'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '../../../../core/stores/themeStore'
import {
  buildOrganizationAuthPalette,
  type OrganizationAuthPalette,
  type OrganizationAuthStyles,
} from './organization-auth.styles'

export function useOrganizationAuthStyles(
  organizationSlug: string,
): {
  isDark: boolean
  loginStyles: OrganizationAuthStyles | null
  mounted: boolean
  palette: OrganizationAuthPalette
} {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const [mounted, setMounted] = useState(false)
  const [loginStyles, setLoginStyles] = useState<OrganizationAuthStyles | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!organizationSlug) {
      return
    }

    let isCancelled = false

    async function fetchLoginStyles() {
      try {
        const response = await fetch(`/api/organizations/${organizationSlug}/styles`, {
          credentials: 'include',
        })
        const data = (await response.json()) as {
          styles?: { login?: OrganizationAuthStyles }
          success?: boolean
        }

        if (!isCancelled && data.success && data.styles?.login) {
          setLoginStyles(data.styles.login)
        }
      } catch {
        if (!isCancelled) {
          setLoginStyles(null)
        }
      }
    }

    fetchLoginStyles()

    return () => {
      isCancelled = true
    }
  }, [organizationSlug])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  return {
    isDark,
    loginStyles,
    mounted,
    palette: buildOrganizationAuthPalette(loginStyles, isDark),
  }
}
