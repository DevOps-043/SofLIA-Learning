import { describe, expect, it } from 'vitest'
import { readJwtBearerToken } from '../bearer-token'

describe('JWT bearer syntax', () => {
  it.each([null, '', 'Bearer undefined', 'Bearer null', 'Bearer sb_secret_key',
    'Bearer header.payload', 'Bearer a..c', 'Bearer a.b.c.d', 'Bearer a.b.c more',
    `Bearer ${'a'.repeat(8190)}.b.c`])('rejects malformed credentials: %s', value => {
    expect(readJwtBearerToken(value)).toBeNull()
  })

  it('preserves a JWT for verification by Auth', () => {
    expect(readJwtBearerToken('bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature_-'))
      .toBe('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature_-')
  })
})
