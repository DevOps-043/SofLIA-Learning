import { check } from 'k6'
import http from 'k6/http'
import { BASE_URL, COURSE_SLUG, requireBaseUrl } from './lib/config.js'

export const options = {
  scenarios: {
    course_view: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.LOAD_COURSE_RPS || 1000),
      timeUnit: '1s',
      duration: __ENV.LOAD_COURSE_DURATION || '10m',
      preAllocatedVUs: Number(__ENV.LOAD_COURSE_PREALLOCATED_VUS || 800),
      maxVUs: Number(__ENV.LOAD_COURSE_MAX_VUS || 2500),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
}

export default function () {
  requireBaseUrl()

  const response = http.get(`${BASE_URL}/api/courses/${COURSE_SLUG}/full?lang=es`)

  check(response, {
    'course view is 2xx or 404 fixture missing': (res) => (res.status >= 200 && res.status < 300) || res.status === 404,
    'course view cache header exists': (res) => Boolean(res.headers['Cache-Control']),
  })
}
