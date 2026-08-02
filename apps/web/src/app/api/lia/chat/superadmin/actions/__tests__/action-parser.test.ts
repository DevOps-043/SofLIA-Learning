import { describe, expect, it, vi } from 'vitest'

// El parser importa el registro de acciones, que arrastra los servicios admin
// marcados con `server-only`. En el entorno jsdom de Vitest ese guard lanza, así
// que se neutraliza: aquí solo se ejercita lógica pura de parseo/validación.
vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import {
  createActionBlockStreamMask,
  hasActionBlock,
  parseActionProposal,
  stripActionBlock,
} from '../action-parser'

function actionBlock(payload: unknown): string {
  return `Voy a hacerlo.\n<soflia-action>${JSON.stringify(payload)}</soflia-action>`
}

describe('parseActionProposal', () => {
  it('returns "none" when the model proposed no action', () => {
    expect(parseActionProposal('Hola, ¿en qué te ayudo?').status).toBe('none')
  })

  it('parses and validates a well-formed action', () => {
    const outcome = parseActionProposal(
      actionBlock({
        action: 'set_user_ban',
        params: { user: 'malo@empresa.com', banned: true, reason: 'Abuso' },
      }),
    )

    expect(outcome.status).toBe('valid')
    if (outcome.status !== 'valid') return
    expect(outcome.proposal.definition.id).toBe('set_user_ban')
    expect(outcome.proposal.params).toMatchObject({
      user: 'malo@empresa.com',
      banned: true,
    })
  })

  it('parses an ordered batch from one action block', () => {
    const outcome = parseActionProposal(actionBlock({
      actions: [
        {
          action: 'remove_user_from_organization',
          params: { organization: 'acme', user: 'persona@empresa.com' },
        },
        {
          action: 'generate_organization_analytics_report',
          params: { organization: 'acme', locale: 'es', days: 30 },
        },
      ],
    }))

    expect(outcome.status).toBe('valid')
    if (outcome.status !== 'valid') return
    expect(outcome.proposals.map((proposal) => proposal.definition.id)).toEqual([
      'remove_user_from_organization',
      'generate_organization_analytics_report',
    ])
  })

  it('rejects the whole batch when one action is outside the allowlist', () => {
    const outcome = parseActionProposal(actionBlock({
      actions: [
        { action: 'generate_organization_analytics_report', params: { organization: 'acme' } },
        { action: 'drop_all_users', params: {} },
      ],
    }))

    expect(outcome.status).toBe('invalid')
  })

  it('rejects batches above the maximum size', () => {
    const actions = Array.from({ length: 6 }, () => ({
      action: 'generate_organization_analytics_report',
      params: { organization: 'acme' },
    }))
    expect(parseActionProposal(actionBlock({ actions })).status).toBe('invalid')
  })

  it('rejects actions that are not in the allowlist (model hallucination)', () => {
    const outcome = parseActionProposal(
      actionBlock({ action: 'drop_all_users', params: {} }),
    )

    expect(outcome.status).toBe('invalid')
    if (outcome.status !== 'invalid') return
    expect(outcome.reason).toContain('no existe en el catálogo')
  })

  it('rejects an action whose params fail schema validation', () => {
    const outcome = parseActionProposal(
      actionBlock({ action: 'set_user_ban', params: { user: 'x@y.com' } }),
    )

    expect(outcome.status).toBe('invalid')
  })

  it('rejects an action with an invalid email in a strongly typed field', () => {
    const outcome = parseActionProposal(
      actionBlock({
        action: 'create_user',
        params: { email: 'no-es-un-email', firstName: 'Ana' },
      }),
    )

    expect(outcome.status).toBe('invalid')
  })

  it('rejects malformed JSON instead of guessing', () => {
    const outcome = parseActionProposal(
      '<soflia-action>{ esto no es json }</soflia-action>',
    )

    expect(outcome.status).toBe('invalid')
    if (outcome.status !== 'invalid') return
    expect(outcome.reason).toContain('JSON')
  })
})

describe('stripActionBlock', () => {
  it('removes the action block from the visible text', () => {
    const content = actionBlock({ action: 'set_user_ban', params: {} })

    expect(hasActionBlock(content)).toBe(true)
    expect(stripActionBlock(content)).toBe('Voy a hacerlo.')
    expect(stripActionBlock(content)).not.toContain('soflia-action')
  })

  it('removes every action block emitted by a legacy model', () => {
    const content = `${actionBlock({ action: 'set_user_ban', params: {} })}\n${actionBlock({ action: 'create_user', params: {} })}`
    expect(stripActionBlock(content)).toBe('Voy a hacerlo.\n\nVoy a hacerlo.')
  })
})

describe('createActionBlockStreamMask', () => {
  it('emite el texto natural por lotes y oculta una acción partida arbitrariamente', () => {
    const mask = createActionBlockStreamMask()
    const chunks = [
      'Voy a preparar la acción.\n<sof',
      'lia-action>{"action":"create_',
      'organization_hierarchy_node","params":{"name":"Ventas"}}',
      '</soflia-',
      'action>\nConfírmala para continuar.',
    ]

    const visible = chunks.map((chunk) => mask.push(chunk)).join('') + mask.flush()

    expect(visible).toBe('Voy a preparar la acción.\n\nConfírmala para continuar.')
    expect(visible).not.toContain('create_organization_hierarchy_node')
    expect(visible).not.toContain('soflia-action')
  })
})
