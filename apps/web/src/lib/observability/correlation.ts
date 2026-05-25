export const CORRELATION_ID_HEADER = 'x-correlation-id'

const CORRELATION_ID_PATTERN = /^[a-zA-Z0-9._:-]{8,128}$/

export function isValidCorrelationId(value: string) {
  return CORRELATION_ID_PATTERN.test(value)
}

export function createCorrelationId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getOrCreateCorrelationId(headers: Headers) {
  const existing = headers.get(CORRELATION_ID_HEADER)
  return existing && isValidCorrelationId(existing) ? existing : createCorrelationId()
}

export function setCorrelationId(headers: Headers, correlationId: string) {
  headers.set(CORRELATION_ID_HEADER, correlationId)
}
