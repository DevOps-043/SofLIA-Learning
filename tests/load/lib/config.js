import { check, fail } from 'k6'
import http from 'k6/http'

export const BASE_URL = (__ENV.LOAD_BASE_URL || '').replace(/\/$/, '')
export const TEST_EMAIL = __ENV.LOAD_TEST_EMAIL || ''
export const TEST_PASSWORD = __ENV.LOAD_TEST_PASSWORD || ''
export const COURSE_SLUG = __ENV.LOAD_COURSE_SLUG || 'curso-demo'

export function requireBaseUrl() {
  if (!BASE_URL) {
    fail('LOAD_BASE_URL is required')
  }
}

export function login() {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    fail('LOAD_TEST_EMAIL and LOAD_TEST_PASSWORD are required')
  }

  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  check(response, {
    'login status is 2xx': (res) => res.status >= 200 && res.status < 300,
  })

  return response.cookies
}

export function authHeaders(cookies) {
  const cookieHeader = Object.entries(cookies)
    .flatMap(([name, values]) => values.map((value) => `${name}=${value.value}`))
    .join('; ')

  return cookieHeader ? { Cookie: cookieHeader } : {}
}

export function jsonHeaders(cookies) {
  return {
    ...authHeaders(cookies),
    'Content-Type': 'application/json',
  }
}
