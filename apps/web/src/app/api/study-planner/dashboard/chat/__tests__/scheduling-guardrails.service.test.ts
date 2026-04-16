import { describe, expect, it } from 'vitest'
import { userExplicitlyAllowsOutsideWorkBlocks } from '../actions/scheduling-guardrails.service'

describe('scheduling-guardrails.service', () => {
  it('treats weekend requests as explicit permission for outside-work placement', () => {
    expect(
      userExplicitlyAllowsOutsideWorkBlocks('mueve la sesion al domingo por favor'),
    ).toBe(true)

    expect(
      userExplicitlyAllowsOutsideWorkBlocks('podemos usar el sabado para recuperar la sesion'),
    ).toBe(true)
  })

  it('does not infer outside-work permission from generic messages', () => {
    expect(
      userExplicitlyAllowsOutsideWorkBlocks('reacomoda la sesion a otro horario'),
    ).toBe(false)
  })
})
