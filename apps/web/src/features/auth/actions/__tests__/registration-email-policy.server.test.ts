import { describe, expect, it } from 'vitest'

import { validatePublicRegistrationEmail } from '../registration-email-policy.server'

describe('public registration email policy', () => {
  it('blocks reserved and disposable domains observed during the incident', () => {
    expect(validatePublicRegistrationEmail('user@example.com')).toContain('correo real')
    expect(validatePublicRegistrationEmail('user@maildrop.cc')).toContain('correo real')
  })

  it('allows a normal permanent mailbox', () => {
    expect(validatePublicRegistrationEmail('persona@empresa.mx')).toBeNull()
  })
})
