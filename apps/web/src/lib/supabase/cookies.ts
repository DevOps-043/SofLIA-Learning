type CookieValue = {
  name: string
  value: string
}

type CookieOptions = {
  path?: string
  maxAge?: number
  domain?: string
  secure?: boolean
  sameSite?: string
  [key: string]: unknown
}

type CookieToSet = CookieValue & {
  options?: CookieOptions
}

type BrowserCookieTarget = {
  cookie: string
}

export interface SupabaseCookieAdapter {
  getAll(): CookieValue[]
  setAll(cookiesToSet: CookieToSet[]): void
}

type ServerCookieStore = {
  getAll(): ReadonlyArray<CookieValue>
  set?(name: string, value: string, options?: CookieOptions): void
}

function normalizeSameSite(value?: string): string | null {
  if (!value) return null

  const normalized = value.toLowerCase()
  if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
    return normalized
  }

  return null
}

export function parseDocumentCookies(cookieHeader: string): CookieValue[] {
  if (!cookieHeader.trim()) {
    return []
  }

  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separatorIndex = part.indexOf('=')
      if (separatorIndex === -1) {
        return { name: part, value: '' }
      }

      const name = part.slice(0, separatorIndex)
      const rawValue = part.slice(separatorIndex + 1)

      return {
        name,
        value: decodeURIComponent(rawValue),
      }
    })
}

export function serializeBrowserCookie({
  name,
  value,
  options,
}: CookieToSet): string {
  const segments = [`${name}=${encodeURIComponent(value)}`]

  if (options?.path) segments.push(`path=${options.path}`)
  if (typeof options?.maxAge === 'number') segments.push(`max-age=${options.maxAge}`)
  if (options?.domain) segments.push(`domain=${options.domain}`)
  if (options?.secure) segments.push('secure')

  const sameSite = normalizeSameSite(options?.sameSite)
  if (sameSite) segments.push(`samesite=${sameSite}`)

  return segments.join('; ')
}

export function createBrowserCookieAdapter(target: BrowserCookieTarget): SupabaseCookieAdapter {
  return {
    getAll(): CookieValue[] {
      return parseDocumentCookies(target.cookie)
    },
    setAll(cookiesToSet: CookieToSet[]) {
      cookiesToSet.forEach(cookie => {
        target.cookie = serializeBrowserCookie(cookie)
      })
    },
  }
}

export function createServerCookieAdapter(cookieStore: ServerCookieStore): SupabaseCookieAdapter {
  return {
    getAll() {
      return [...cookieStore.getAll()]
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set?.(name, value, options)
        })
      } catch {
        // Server Components may expose read-only cookies; ignore write attempts there.
      }
    },
  }
}
