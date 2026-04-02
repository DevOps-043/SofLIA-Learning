import { afterEach, describe, expect, it } from 'vitest'

import {
  hasSensitiveAncestor,
  sensitiveInputFilter,
  shouldMaskInputElement,
} from '../session-recorder-filters'

afterEach(() => {
  document.body.innerHTML = ''
})

function makeInput(attributes: Record<string, string> = {}) {
  const input = document.createElement('input')

  for (const [key, value] of Object.entries(attributes)) {
    input.setAttribute(key, value)
  }

  document.body.appendChild(input)
  return input
}

describe('sensitiveInputFilter', () => {
  it('masks value of input[type=password]', () => {
    const input = makeInput({ type: 'password' })

    expect(shouldMaskInputElement(input)).toBe(true)
    expect(sensitiveInputFilter('secret123', input)).toBe('*********')
  })

  it('does not capture credit card number inputs', () => {
    const input = makeInput({ autocomplete: 'cc-number', type: 'text' })

    expect(shouldMaskInputElement(input)).toBe(true)
    expect(sensitiveInputFilter('4111111111111111', input)).toBe('****************')
  })

  it('masks value of card-related text inputs', () => {
    const input = makeInput({ id: 'card-holder', type: 'text' })

    expect(shouldMaskInputElement(input)).toBe(true)
    expect(sensitiveInputFilter('Ada Lovelace', input)).toBe('************')
  })

  it('does not mask regular text inputs', () => {
    const input = makeInput({ name: 'display_name', type: 'text' })

    expect(shouldMaskInputElement(input)).toBe(false)
    expect(sensitiveInputFilter('Ada Lovelace', input)).toBe('Ada Lovelace')
  })

  it('respects data-no-record attribute', () => {
    const input = makeInput({ name: 'notes', type: 'text' })
    input.setAttribute('data-no-record', 'true')

    expect(hasSensitiveAncestor(input)).toBe(true)
    expect(sensitiveInputFilter('private notes', input)).toBe('*************')
  })

  it('masks inputs inside forms with class sensitive', () => {
    const form = document.createElement('form')
    form.className = 'sensitive'

    const input = document.createElement('input')
    input.setAttribute('name', 'notes')
    form.appendChild(input)
    document.body.appendChild(form)

    expect(hasSensitiveAncestor(input)).toBe(true)
    expect(sensitiveInputFilter('visible text', input)).toBe('************')
  })
})
