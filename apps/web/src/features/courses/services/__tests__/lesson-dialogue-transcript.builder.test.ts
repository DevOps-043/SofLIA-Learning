import { describe, expect, it } from 'vitest'

import {
  buildDialogueTranscriptHtml,
  escapeHtml,
  type DialogueTranscriptRows,
} from '../lesson-dialogue-transcript.builder'

function makeRows(overrides: Partial<DialogueTranscriptRows> = {}): DialogueTranscriptRows {
  return {
    activities: [{ activity_id: 'a1', activity_title: 'Reflexión guiada' }],
    dialogueSessions: [{ session_id: 's1', activity_id: 'a1' }],
    dialogueTurns: [
      { session_id: 's1', role: 'user', content: 'Hola', turn_number: 1 },
      { session_id: 's1', role: 'assistant', content: 'Bienvenido', turn_number: 2 },
      { session_id: 's1', role: 'system', content: 'interno', turn_number: 3 },
    ],
    liaConversations: [],
    liaMessages: [],
    ...overrides,
  }
}

describe('escapeHtml', () => {
  it('escapes markup and preserves line breaks as <br>', () => {
    expect(escapeHtml('<b>x</b> & "y"\nz')).toBe(
      '&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;<br>z',
    )
  })
})

describe('buildDialogueTranscriptHtml', () => {
  it('renders user and assistant turns verbatim, excluding system turns', () => {
    const result = buildDialogueTranscriptHtml(makeRows(), 10_000)

    expect(result.truncated).toBe(false)
    expect(result.html).toContain('<h3>Diálogo: Reflexión guiada</h3>')
    expect(result.html).toContain('<p><strong>Usuario:</strong> Hola</p>')
    expect(result.html).toContain(
      '<blockquote><p><strong>SofLIA:</strong> Bienvenido</p></blockquote>',
    )
    expect(result.html).not.toContain('interno')
  })

  it('escapes turn content so it is never treated as markup', () => {
    const result = buildDialogueTranscriptHtml(
      makeRows({
        dialogueTurns: [
          {
            session_id: 's1',
            role: 'user',
            content: '<script>alert(1)</script>',
            turn_number: 1,
          },
        ],
      }),
      10_000,
    )

    expect(result.html).not.toContain('<script>')
    expect(result.html).toContain('&lt;script&gt;')
  })

  it('orders turns by turn_number even when given unsorted', () => {
    const result = buildDialogueTranscriptHtml(
      makeRows({
        dialogueTurns: [
          { session_id: 's1', role: 'assistant', content: 'segundo', turn_number: 2 },
          { session_id: 's1', role: 'user', content: 'primero', turn_number: 1 },
        ],
      }),
      10_000,
    )

    expect(result.html.indexOf('primero')).toBeLessThan(
      result.html.indexOf('segundo'),
    )
  })

  it('returns empty html when there are no speaker turns', () => {
    const result = buildDialogueTranscriptHtml(
      makeRows({ dialogueTurns: [] }),
      10_000,
    )

    expect(result.html).toBe('')
    expect(result.truncated).toBe(false)
  })

  it('truncates at whole-turn boundaries and appends a visible notice', () => {
    const longContent = 'x'.repeat(300)
    const result = buildDialogueTranscriptHtml(
      makeRows({
        dialogueTurns: [
          { session_id: 's1', role: 'user', content: longContent, turn_number: 1 },
          { session_id: 's1', role: 'user', content: longContent, turn_number: 2 },
          { session_id: 's1', role: 'user', content: longContent, turn_number: 3 },
        ],
      }),
      900,
    )

    expect(result.truncated).toBe(true)
    expect(result.html).toContain('La transcripción fue recortada por longitud')
    // No mid-tag cuts: every opened paragraph is closed.
    const opens = result.html.match(/<p>/g)?.length ?? 0
    const closes = result.html.match(/<\/p>/g)?.length ?? 0
    expect(opens).toBe(closes)
  })

  it('renders legacy lia conversations ordered by message_sequence', () => {
    const result = buildDialogueTranscriptHtml(
      makeRows({
        dialogueSessions: [],
        dialogueTurns: [],
        liaConversations: [
          {
            conversation_id: 'conv1',
            activity_id: 'a1',
            conversation_title: null,
          },
        ],
        liaMessages: [
          {
            conversation_id: 'conv1',
            role: 'assistant',
            content: 'respuesta',
            message_sequence: 2,
          },
          {
            conversation_id: 'conv1',
            role: 'user',
            content: 'pregunta',
            message_sequence: 1,
          },
        ],
      }),
      10_000,
    )

    expect(result.html).toContain(
      '<h3>Conversación con SofLIA: Reflexión guiada</h3>',
    )
    expect(result.html.indexOf('pregunta')).toBeLessThan(
      result.html.indexOf('respuesta'),
    )
  })
})
