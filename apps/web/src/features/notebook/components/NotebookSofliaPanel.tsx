'use client'

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, Send, Sparkles, WandSparkles, X } from 'lucide-react'

import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import {
  askNotebookAssistant,
  type NotebookAssistantTurn,
} from '../services/notebook.client.service'
import { NoteContentView } from './NoteContentView'
import { NoteEnrichmentPanel } from './NoteEnrichmentPanel'

interface NotebookSofliaPanelProps {
  orgSlug: string
  noteId: string
  /** Oculta el análisis para el compendio (el enriquecimiento no aplica). */
  showAnalysis?: boolean
  /** Aplica una edición propuesta por SofLIA al contenido del editor. */
  onApplyEdit?: (html: string) => void
  onError: (message: string) => void
}

interface ChatMessage extends NotebookAssistantTurn {
  /** Edición propuesta pendiente de aceptar/descartar (solo en assistant). */
  proposedContent?: string | null
  proposalState?: 'pending' | 'applied' | 'dismissed'
}

const MAX_HISTORY = 8

/**
 * Panel derecho dedicado a SofLIA: muestra el análisis del apunte y un chat
 * donde SofLIA lee la nota y responde/sugiere mejoras (Fase 1: solo texto).
 */
export function NotebookSofliaPanel({
  orgSlug,
  noteId,
  showAnalysis = true,
  onApplyEdit,
  onError,
}: NotebookSofliaPanelProps) {
  const { t } = useTranslation('notebook')
  const theme = useBusinessPanelTheme()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    })
  }

  const send = async () => {
    const text = input.trim()
    if (!text || isSending) return
    const nextHistory: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text },
    ]
    setMessages(nextHistory)
    setInput('')
    setIsSending(true)
    try {
      // El historial que viaja al servidor solo lleva rol y texto.
      const history: NotebookAssistantTurn[] = nextHistory
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }))
      const result = await askNotebookAssistant(orgSlug, noteId, text, history)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply,
          proposedContent: result.proposedContent,
          proposalState: result.proposedContent ? 'pending' : undefined,
        },
      ])
      scrollToBottom()
    } catch (error) {
      onError(
        error instanceof Error ? error.message : t('soflia.chat.errorFallback'),
      )
    } finally {
      setIsSending(false)
    }
  }

  const resolveProposal = (index: number, state: 'applied' | 'dismissed') => {
    setMessages((prev) =>
      prev.map((message, i) =>
        i === index ? { ...message, proposalState: state } : message,
      ),
    )
  }

  const applyProposal = (index: number, html: string) => {
    if (!onApplyEdit) return
    onApplyEdit(html)
    resolveProposal(index, 'applied')
  }

  return (
    <div className="flex flex-col gap-4">
      {showAnalysis && (
        <NoteEnrichmentPanel
          orgSlug={orgSlug}
          noteId={noteId}
          onTaskActionError={() => onError(t('enrichment.taskActionError'))}
        />
      )}

      <div
        className="flex flex-col rounded-2xl border shadow-sm"
        style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
      >
        <div
          className="flex items-center gap-1.5 border-b px-4 py-3"
          style={{ borderColor: theme.borderColor }}
        >
          <Sparkles className="h-4 w-4" style={{ color: theme.actionColor }} />
          <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
            {t('soflia.chat.title')}
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex max-h-[46vh] min-h-[120px] flex-col gap-3 overflow-y-auto px-4 py-3"
        >
          {messages.length === 0 ? (
            <p className="text-xs leading-relaxed" style={{ color: theme.mutedTextColor }}>
              {t('soflia.chat.placeholder')}
            </p>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div
                  className={
                    message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                  }
                >
                  <div
                    className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed"
                    style={
                      message.role === 'user'
                        ? { backgroundColor: theme.actionColor, color: theme.onActionColor }
                        : {
                            backgroundColor: `${theme.actionColor}12`,
                            color: theme.subtextColor,
                          }
                    }
                  >
                    {message.content}
                  </div>
                </div>

                {message.role === 'assistant' && message.proposedContent && (
                  <div
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: theme.borderColor,
                      backgroundColor: `${theme.actionColor}08`,
                    }}
                  >
                    <p
                      className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: theme.actionColor }}
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                      {t('soflia.edit.proposalTitle')}
                    </p>
                    <div className="max-h-56 overflow-y-auto rounded-lg border p-2" style={{ borderColor: theme.borderColor }}>
                      <NoteContentView
                        className="notebook-prose--preview"
                        html={message.proposedContent}
                      />
                    </div>

                    {message.proposalState === 'applied' ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.actionColor }}>
                        <Check className="h-3.5 w-3.5" />
                        {t('soflia.edit.applied')}
                      </p>
                    ) : message.proposalState === 'dismissed' ? (
                      <p className="mt-2 text-xs" style={{ color: theme.mutedTextColor }}>
                        {t('soflia.edit.dismissed')}
                      </p>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            applyProposal(index, message.proposedContent as string)
                          }
                          disabled={!onApplyEdit}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('soflia.edit.apply')}
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveProposal(index, 'dismissed')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{ borderColor: theme.borderColor, color: theme.subtextColor }}
                        >
                          <X className="h-3.5 w-3.5" />
                          {t('soflia.edit.discard')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div
                className="inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm"
                style={{ backgroundColor: `${theme.actionColor}12`, color: theme.mutedTextColor }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('soflia.chat.thinking')}
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-end gap-2 border-t p-3"
          style={{ borderColor: theme.borderColor }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send()
              }
            }}
            rows={1}
            maxLength={2_000}
            placeholder={t('soflia.chat.inputPlaceholder')}
            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-sm outline-none"
            style={{ borderColor: theme.borderColor, color: theme.textColor }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={isSending || !input.trim()}
            aria-label={t('soflia.chat.send')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
