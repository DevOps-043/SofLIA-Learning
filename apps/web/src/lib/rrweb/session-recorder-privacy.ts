import type { RrwebRecordOptions } from './rrweb-loader'
import {
  buildSessionRecorderMaskingConfig,
  SESSION_RECORDER_BLOCK_CLASS,
  SESSION_RECORDER_BLOCK_SELECTOR,
  SESSION_RECORDER_MASK_TEXT_CLASS,
} from './session-recorder-filters'

const SENSITIVE_QUERY_PARAMS = [
  'access_token',
  'api_key',
  'auth',
  'authorization',
  'code',
  'password',
  'refresh_token',
  'secret',
  'session',
  'state',
  'token',
]

export function buildSessionRecorderPrivacyConfig(): Pick<
  RrwebRecordOptions,
  | 'blockClass'
  | 'blockSelector'
  | 'maskAllInputs'
  | 'maskInputFn'
  | 'maskInputOptions'
  | 'maskTextClass'
  | 'maskTextFn'
  | 'maskTextSelector'
> {
  return {
    blockClass: SESSION_RECORDER_BLOCK_CLASS,
    blockSelector: SESSION_RECORDER_BLOCK_SELECTOR,
    maskAllInputs: false,
    maskTextClass: SESSION_RECORDER_MASK_TEXT_CLASS,
    ...buildSessionRecorderMaskingConfig(),
  }
}

export function sanitizeRecordedUrl(rawUrl: string): string {
  const isAbsolute = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawUrl)

  try {
    const url = isAbsolute ? new URL(rawUrl) : new URL(rawUrl, 'https://session-recorder.local')

    for (const key of SENSITIVE_QUERY_PARAMS) {
      url.searchParams.delete(key)
    }

    if (isAbsolute) {
      return url.toString()
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return rawUrl
  }
}
