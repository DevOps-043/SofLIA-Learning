import { check, fail } from 'k6'
import http from 'k6/http'
import { BASE_URL, TEST_EMAIL, TEST_PASSWORD, requireBaseUrl } from './lib/config.js'

export const options = {
  scenarios: {
    auth_login: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.LOAD_AUTH_RPS || 500),
      timeUnit: '1s',
      duration: __ENV.LOAD_AUTH_DURATION || '5m',
      preAllocatedVUs: Number(__ENV.LOAD_AUTH_PREALLOCATED_VUS || 500),
      maxVUs: Number(__ENV.LOAD_AUTH_MAX_VUS || 1500),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
}

export default function () {
  requireBaseUrl()
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    fail('LOAD_TEST_EMAIL and LOAD_TEST_PASSWORD are required')
  }

  const response = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  check(response, {
    'auth login is not 5xx': (res) => res.status < 500,
    'auth login has rate headers on 429': (res) => res.status !== 429 || Boolean(res.headers['Retry-After']),
  })
}
