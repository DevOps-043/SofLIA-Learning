/**
 * Pure builder that renders the verbatim SofLIA dialogue transcript as safe
 * HTML for the lesson auto-note. Turn content is plain text coming from the
 * user/model, so it is always HTML-escaped — never trusted as markup.
 *
 * Length is controlled BEFORE sanitization at whole-block boundaries (a block
 * is a heading or a single turn), because the sanitizer truncates with a raw
 * substring and would otherwise cut mid-tag.
 */

export interface TranscriptActivityRow {
  activity_id: string
  activity_title: string | null
}

export interface TranscriptDialogueSessionRow {
  activity_id: string
  session_id: string
}

export interface TranscriptDialogueTurnRow {
  content: string
  role: string
  session_id: string
  turn_number: number
}

export interface TranscriptLiaConversationRow {
  activity_id: string | null
  conversation_id: string
  conversation_title: string | null
}

export interface TranscriptLiaMessageRow {
  content: string
  conversation_id: string
  message_sequence: number
  role: string
}

export interface DialogueTranscriptRows {
  activities: TranscriptActivityRow[]
  dialogueSessions: TranscriptDialogueSessionRow[]
  dialogueTurns: TranscriptDialogueTurnRow[]
  liaConversations: TranscriptLiaConversationRow[]
  liaMessages: TranscriptLiaMessageRow[]
}

export interface DialogueTranscriptResult {
  html: string
  truncated: boolean
}

const TRUNCATION_NOTICE =
  '<p><em>La transcripción fue recortada por longitud. Consulta la actividad para ver el diálogo completo.</em></p>'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, '<br>')
}

interface TranscriptBlock {
  html: string
  /** Headings only count when at least one of their turns is appended. */
  isHeading: boolean
}

function turnBlock(role: string, content: string): TranscriptBlock {
  const speaker = role === 'user' ? 'Usuario' : 'SofLIA'
  const paragraph = `<p><strong>${speaker}:</strong> ${escapeHtml(content)}</p>`
  return {
    html: role === 'user' ? paragraph : `<blockquote>${paragraph}</blockquote>`,
    isHeading: false,
  }
}

function headingBlock(title: string): TranscriptBlock {
  return { html: `<h3>${escapeHtml(title)}</h3>`, isHeading: true }
}

function isSpeakerRole(role: string): boolean {
  return role === 'user' || role === 'assistant'
}

function buildBlocks(rows: DialogueTranscriptRows): TranscriptBlock[] {
  const activityTitleById = new Map(
    rows.activities.map((activity) => [
      activity.activity_id,
      activity.activity_title || 'Actividad SofLIA',
    ]),
  )

  const blocks: TranscriptBlock[] = []

  for (const session of rows.dialogueSessions) {
    const turns = rows.dialogueTurns
      .filter(
        (turn) => turn.session_id === session.session_id && isSpeakerRole(turn.role),
      )
      .sort((a, b) => a.turn_number - b.turn_number)

    if (turns.length === 0) continue

    blocks.push(
      headingBlock(
        `Diálogo: ${activityTitleById.get(session.activity_id) || 'Actividad SofLIA'}`,
      ),
    )
    for (const turn of turns) {
      blocks.push(turnBlock(turn.role, turn.content))
    }
  }

  for (const conversation of rows.liaConversations) {
    const messages = rows.liaMessages
      .filter(
        (message) =>
          message.conversation_id === conversation.conversation_id &&
          isSpeakerRole(message.role),
      )
      .sort((a, b) => a.message_sequence - b.message_sequence)

    if (messages.length === 0) continue

    const title =
      conversation.conversation_title ||
      activityTitleById.get(conversation.activity_id || '') ||
      'Actividad con SofLIA'
    blocks.push(headingBlock(`Conversación con SofLIA: ${title}`))
    for (const message of messages) {
      blocks.push(turnBlock(message.role, message.content))
    }
  }

  return blocks
}

/**
 * Renders the transcript within `budget` characters. Appends whole blocks
 * only; on overflow it stops and adds a visible truncation notice. Returns an
 * empty html string when there are no dialogue turns at all (section omitted)
 * or when not even one exchange fits the budget.
 */
export function buildDialogueTranscriptHtml(
  rows: DialogueTranscriptRows,
  budget: number,
): DialogueTranscriptResult {
  const blocks = buildBlocks(rows)
  if (blocks.length === 0) {
    return { html: '', truncated: false }
  }

  const effectiveBudget = budget - TRUNCATION_NOTICE.length
  const parts: string[] = []
  let used = 0
  let appendedTurns = 0
  let truncated = false
  let pendingHeading: TranscriptBlock | null = null

  for (const block of blocks) {
    if (block.isHeading) {
      pendingHeading = block
      continue
    }

    const headingLength = pendingHeading ? pendingHeading.html.length : 0
    if (used + headingLength + block.html.length > effectiveBudget) {
      truncated = true
      break
    }

    if (pendingHeading) {
      parts.push(pendingHeading.html)
      used += pendingHeading.html.length
      pendingHeading = null
    }
    parts.push(block.html)
    used += block.html.length
    appendedTurns += 1
  }

  if (appendedTurns === 0) {
    return { html: '', truncated: true }
  }

  if (truncated) {
    parts.push(TRUNCATION_NOTICE)
  }

  return { html: parts.join(''), truncated }
}
