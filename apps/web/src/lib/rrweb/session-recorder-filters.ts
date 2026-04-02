import type { RrwebRecordOptions } from './rrweb-loader'

const SENSITIVE_NAME_PATTERN = /(credit|card|cvc|cvv|password|secret|token|ssn)/i
const MASK_MIN_LENGTH = 8

export const SESSION_RECORDER_BLOCK_CLASS = 'rr-block'
export const SESSION_RECORDER_MASK_TEXT_CLASS = 'rr-mask'
export const SESSION_RECORDER_BLOCK_SELECTOR = [
  '[data-no-record]',
  '[data-no-record] *',
  '[data-rr-block]',
  '[data-rr-block] *',
  'form.sensitive',
  'input[autocomplete="cc-number"]',
  'input[autocomplete="cc-csc"]',
  'input[name*="card" i]',
  'input[name*="credit" i]',
  'input[name*="cvv" i]',
  'input[name*="cvc" i]',
  'input[id*="card" i]',
  'input[id*="credit" i]',
].join(', ')
export const SESSION_RECORDER_MASK_TEXT_SELECTOR =
  '.rr-mask, [data-mask-text], .sensitive [data-mask-text], form.sensitive .rr-mask'

function buildMask(text: string): string {
  return '*'.repeat(Math.max(text.length, MASK_MIN_LENGTH))
}

function readElementIdentity(element: HTMLElement): string {
  return [
    element.getAttribute('name') ?? '',
    element.getAttribute('id') ?? '',
    element.getAttribute('autocomplete') ?? '',
  ]
    .join(' ')
    .trim()
}

function isSensitiveAutocomplete(element: HTMLElement): boolean {
  const autocomplete = (element.getAttribute('autocomplete') ?? '').toLowerCase()
  return autocomplete === 'cc-number' || autocomplete === 'cc-csc'
}

export function hasSensitiveAncestor(element: HTMLElement | null): boolean {
  if (!element || typeof element.closest !== 'function') {
    return false
  }

  return Boolean(
    element.closest('form.sensitive, .sensitive, [data-no-record], [data-rr-block]')
  )
}

export function shouldMaskInputElement(element: HTMLElement | null): boolean {
  if (!element) {
    return false
  }

  if (hasSensitiveAncestor(element) || isSensitiveAutocomplete(element)) {
    return true
  }

  const inputType = (element.getAttribute('type') ?? '').toLowerCase()
  if (inputType === 'password' || inputType === 'email' || inputType === 'tel') {
    return true
  }

  return SENSITIVE_NAME_PATTERN.test(readElementIdentity(element))
}

export function sensitiveInputFilter(text: string, element: HTMLElement): string {
  if (!text) {
    return ''
  }

  return shouldMaskInputElement(element) ? buildMask(text) : text
}

export function sensitiveTextFilter(
  text: string,
  element: HTMLElement | null
): string {
  if (!text || !element) {
    return text
  }

  return hasSensitiveAncestor(element) ? buildMask(text) : text
}

export function buildSessionRecorderMaskingConfig(): Pick<
  RrwebRecordOptions,
  'maskInputFn' | 'maskInputOptions' | 'maskTextFn' | 'maskTextSelector'
> {
  return {
    maskInputFn: sensitiveInputFilter,
    maskInputOptions: {
      email: true,
      password: true,
      search: true,
      tel: true,
      text: true,
      textarea: true,
      url: true,
    },
    maskTextFn: sensitiveTextFilter,
    maskTextSelector: SESSION_RECORDER_MASK_TEXT_SELECTOR,
  }
}
