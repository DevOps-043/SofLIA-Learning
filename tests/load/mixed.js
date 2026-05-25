import { check, sleep } from 'k6'
import http from 'k6/http'
import { BASE_URL, COURSE_SLUG, jsonHeaders, login, requireBaseUrl } from './lib/config.js'

export const options = {
  scenarios: {
    mixed: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.LOAD_MIXED_RPS || 1000),
      timeUnit: '1s',
      duration: __ENV.LOAD_MIXED_DURATION || '30m',
      preAllocatedVUs: Number(__ENV.LOAD_MIXED_PREALLOCATED_VUS || 1000),
      maxVUs: Number(__ENV.LOAD_MIXED_MAX_VUS || 3000),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
}

export function setup() {
  requireBaseUrl()
  return { cookies: login() }
}

export default function (data) {
  const random = Math.random()

  if (random < 0.55) {
    check(http.get(`${BASE_URL}/api/courses/${COURSE_SLUG}/full?lang=es`), {
      'course read is not 5xx': (res) => res.status < 500,
    })
    return
  }

  if (random < 0.85) {
    check(http.get(`${BASE_URL}/downloads`), {
      'downloads page is 2xx': (res) => res.status >= 200 && res.status < 300,
      'downloads page has cache header': (res) => Boolean(res.headers['Cache-Control']),
    })
    return
  }

  if (random < 0.95) {
    check(http.get(`${BASE_URL}/api/auth/me`, { headers: jsonHeaders(data.cookies) }), {
      'auth me is not 5xx': (res) => res.status < 500,
    })
    return
  }

  check(http.post(
    `${BASE_URL}/api/ai-chat`,
    JSON.stringify({
      message: 'Dame una guia corta para continuar mi aprendizaje.',
      context: 'general',
      language: 'es',
      conversationHistory: [],
    }),
    { headers: jsonHeaders(data.cookies), timeout: '35s' },
  ), {
    'ai chat in mix is not 5xx': (res) => res.status < 500,
  })

  sleep(1)
}
