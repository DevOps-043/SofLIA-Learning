import { check } from 'k6'
import http from 'k6/http'
import { BASE_URL, jsonHeaders, login, requireBaseUrl } from './lib/config.js'

export const options = {
  scenarios: {
    lia_chat: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.LOAD_LIA_RPS || 100),
      timeUnit: '1s',
      duration: __ENV.LOAD_LIA_DURATION || '5m',
      preAllocatedVUs: Number(__ENV.LOAD_LIA_PREALLOCATED_VUS || 150),
      maxVUs: Number(__ENV.LOAD_LIA_MAX_VUS || 500),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<30000'],
  },
}

export function setup() {
  requireBaseUrl()
  return { cookies: login() }
}

export default function (data) {
  const response = http.post(
    `${BASE_URL}/api/ai-chat`,
    JSON.stringify({
      message: 'Resume brevemente que puedo hacer en la plataforma.',
      context: 'general',
      language: 'es',
      conversationHistory: [],
    }),
    { headers: jsonHeaders(data.cookies), timeout: '35s' },
  )

  check(response, {
    'lia chat is not 5xx': (res) => res.status < 500,
    'lia chat has rate headers on 429': (res) => res.status !== 429 || Boolean(res.headers['Retry-After']),
  })
}
