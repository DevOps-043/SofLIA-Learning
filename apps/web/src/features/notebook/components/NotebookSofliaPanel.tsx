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
import styles from './NotebookEditor.module.css'

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
    <div className={styles.sofliaStack}>
      {showAnalysis && (
        <NoteEnrichmentPanel orgSlug={orgSlug} noteId={noteId} onError={onError} />
      )}

      <div
        className={styles.chatCard}
      >
        <div className={styles.chatHeader}>
          <span className={styles.chatHeaderIcon}>
            <Sparkles />
          </span>
          <div>
            <p className={styles.chatTitle}>{t('soflia.chat.title')}</p>
            <span className={styles.chatStatus}>SofLIA</span>
          </div>
        </div>

        <div
          ref={scrollRef}
          className={styles.chatMessages}
        >
          {messages.length === 0 ? (
            <div className={styles.chatEmpty}>
              <WandSparkles />
              <p>
              {t('soflia.chat.placeholder')}
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={styles.chatTurn}>
                <div
                  className={
                    message.role === 'user'
                      ? styles.chatRowUser
                      : styles.chatRowAssistant
                  }
                >
                  <div
                    className={
                      message.role === 'user'
                        ? styles.chatBubbleUser
                        : styles.chatBubbleAssistant
                    }
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
                    className={styles.proposalCard}
                    style={{
                      borderColor: theme.borderColor,
                      backgroundColor: `${theme.actionColor}08`,
                    }}
                  >
                    <p
                      className={styles.proposalTitle}
                      style={{ color: theme.actionColor }}
                    >
                      <WandSparkles className="h-3.5 w-3.5" />
                      {t('soflia.edit.proposalTitle')}
                    </p>
                    <div className={styles.proposalPreview} style={{ borderColor: theme.borderColor }}>
                      <NoteContentView
                        className="notebook-prose--preview"
                        html={message.proposedContent}
                      />
                    </div>

                    {message.proposalState === 'applied' ? (
                      <p className={styles.proposalApplied} style={{ color: theme.actionColor }}>
                        <Check className="h-3.5 w-3.5" />
                        {t('soflia.edit.applied')}
                      </p>
                    ) : message.proposalState === 'dismissed' ? (
                      <p className={styles.proposalDismissed} style={{ color: theme.mutedTextColor }}>
                        {t('soflia.edit.dismissed')}
                      </p>
                    ) : (
                      <div className={styles.proposalActions}>
                        <button
                          type="button"
                          onClick={() =>
                            applyProposal(index, message.proposedContent as string)
                          }
                          disabled={!onApplyEdit}
                          className={styles.proposalApply}
                          style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('soflia.edit.apply')}
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveProposal(index, 'dismissed')}
                          className={styles.proposalDiscard}
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
            <div className={styles.chatRowAssistant}>
              <div
                className={styles.chatThinking}
                style={{ backgroundColor: `${theme.actionColor}12`, color: theme.mutedTextColor }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('soflia.chat.thinking')}
              </div>
            </div>
          )}
        </div>

        <div className={styles.chatComposer}>
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
            className={styles.chatInput}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={isSending || !input.trim()}
            aria-label={t('soflia.chat.send')}
            className={styles.chatSend}
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
