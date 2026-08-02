import { describe, expect, it } from 'vitest'
import {
  buildActionAuditDetails,
  buildVisibleActionExecutionMessage,
} from '../action-result.visibility'

describe('visibilidad del resultado de acciones', () => {
  it('muestra únicamente el resumen y nunca IDs ni detalles internos', () => {
    const message = buildVisibleActionExecutionMessage({
      summary: 'Se creó “Dirección de ventas” correctamente.',
      details: {
        nodeId: '5941ad4d-4964-4dca-9fd9-cbaca20d415d',
        structureId: '7ab4fe54-fcb4-46ed-bde3-09b0f3b1e74f',
      },
    })

    expect(message).toBe('✅ Se creó “Dirección de ventas” correctamente.')
    expect(message).not.toContain('nodeId')
    expect(message).not.toContain('5941ad4d')
  })

  it('redacta secretos de auditoría, conservando identificadores técnicos', () => {
    expect(buildActionAuditDetails({
      userId: 'user-1',
      temporaryPassword: 'DoNotLogMe',
      inviteToken: 'DoNotLogMeEither',
    })).toEqual({
      userId: 'user-1',
      temporaryPassword: '[REDACTED]',
      inviteToken: '[REDACTED]',
    })
  })
})
