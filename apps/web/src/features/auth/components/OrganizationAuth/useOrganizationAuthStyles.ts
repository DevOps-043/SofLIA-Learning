'use client'

import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useThemeStore } from '../../../../core/stores/themeStore'
import {
  buildOrganizationAuthPalette,
  resolveOrganizationAuthStylesForMode,
  type OrganizationAuthPalette,
  type OrganizationAuthStyles,
} from './organization-auth.styles'

interface OrganizationAuthStyleState {
  isDark: boolean
  loginStyles: OrganizationAuthStyles | null
  mounted: boolean
  organizationSlug: string
  palette: OrganizationAuthPalette
}

const OrganizationAuthStylesContext =
  createContext<OrganizationAuthStyleState | null>(null)

export function OrganizationAuthStylesProvider({
  children,
  value,
}: {
  children: ReactNode
  value: OrganizationAuthStyleState
}) {
  return createElement(OrganizationAuthStylesContext.Provider, { value }, children)
}

export function useOrganizationAuthStyles(
  organizationSlug: string,
  initialLoginStyles?: OrganizationAuthStyles | null,
): OrganizationAuthStyleState {
  const contextStyles = useContext(OrganizationAuthStylesContext)
  const activeContextStyles =
    contextStyles?.organizationSlug === organizationSlug ? contextStyles : null
  const shouldUseContextStyles = activeContextStyles !== null

  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const [mounted, setMounted] = useState(false)
  const [loginStyles, setLoginStyles] = useState<OrganizationAuthStyles | null>(
    shouldUseContextStyles
      ? activeContextStyles.loginStyles
      : (initialLoginStyles ?? null),
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initialLoginStyles !== undefined) {
      setLoginStyles(initialLoginStyles)
    }
  }, [initialLoginStyles])

  useEffect(() => {
    if (
      shouldUseContextStyles ||
      !organizationSlug ||
      initialLoginStyles !== undefined
    ) {
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
  }, [initialLoginStyles, organizationSlug, shouldUseContextStyles])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  if (shouldUseContextStyles) {
    return activeContextStyles
  }

  const effectiveLoginStyles = resolveOrganizationAuthStylesForMode(
    loginStyles,
    isDark,
  )

  return {
    isDark,
    loginStyles: effectiveLoginStyles,
    mounted,
    organizationSlug,
    palette: buildOrganizationAuthPalette(effectiveLoginStyles, isDark),
  }
}
