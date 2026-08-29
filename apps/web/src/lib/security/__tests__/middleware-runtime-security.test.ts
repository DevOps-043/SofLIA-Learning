import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

function readWebFile(relativePath: string) {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

describe('compiled middleware security boundary', () => {
  it('keeps middleware beside src/app so Next includes it in the build', () => {
    expect(fs.existsSync(path.resolve(process.cwd(), 'middleware.ts'))).toBe(false)
    expect(fs.existsSync(path.resolve(process.cwd(), 'src/middleware.ts'))).toBe(true)
  })

  it('forwards the CSP nonce through the Supabase session response', () => {
    const middleware = readWebFile('src/middleware.ts')
    const sessionMiddleware = readWebFile('src/lib/supabase/middleware.ts')

    expect(middleware).toContain('const forwardedRequestHeaders = new Headers(request.headers)')
    expect(middleware).toContain("forwardedRequestHeaders.set('x-nonce', nonce)")
    expect(middleware).toContain('forwardedRequestHeaders,')
    expect(sessionMiddleware).toContain('forwardedRequestHeaders: Headers')
    expect(sessionMiddleware).toContain('headers: forwardedRequestHeaders')
  })

  it('renders the root shell dynamically so Next can nonce its scripts', () => {
    const layout = readWebFile('src/app/layout.tsx')
    const rootHead = readWebFile('src/app/RootHead.tsx')

    expect(layout).toContain("export const dynamic = 'force-dynamic'")
    expect(layout).toContain("requestHeaders.get('x-nonce')")
    expect(layout).toContain('<RootHead nonce={nonce} />')
    expect(rootHead).toContain('nonce={nonce}')
  })

  it('prevents caching early security failures', () => {
    const middleware = readWebFile('src/middleware.ts')

    expect(middleware).toContain("response.headers.set('Cache-Control', 'private, no-store, max-age=0')")
    expect(middleware).toContain("response.headers.set('Pragma', 'no-cache')")
  })

  it('does not turn transient auth failures into a redirect loop', () => {
    const approvedRedirect = readWebFile(
      'src/features/onboarding/components/ApprovedRedirect.tsx',
    )
    const authHook = readWebFile('src/features/auth/hooks/useAuth.ts')
    const businessLayout = readWebFile(
      'src/features/business-panel/components/BusinessPanelLayout.tsx',
    )

    expect(approvedRedirect).not.toContain("removeItem('user-auth-cache')")
    expect(approvedRedirect).not.toContain('window.location.reload()')
    expect(approvedRedirect).toContain("router.replace('/auth/select-organization')")
    expect(authHook).toContain('authUnavailable: Boolean(error)')
    expect(businessLayout).toContain('if (authUnavailable)')
    expect(businessLayout).toContain('AuthUnavailableScreen')
  })

  it('keeps authenticated profile reads compatible with legacy sessions', () => {
    const profileQuery = readWebFile(
      'src/features/profile/services/profile-server/profile-query.service.ts',
    )

    expect(profileQuery).toContain("import { createAdminClient }")
    expect(profileQuery).not.toContain("import { createClient }")
  })
})
