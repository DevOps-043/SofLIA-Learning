"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageSquare, Send, Sparkles, X } from "lucide-react";
import type { LiveMessage } from "./types";
import styles from "./Live.module.css";
export interface ChatEntry {
  id: string;
  author_name: string;
  content: string;
  created_at?: string;
}
interface ChatPanelProps {
  messages: (LiveMessage | ChatEntry)[];
  privateChat?: boolean;
  disabled?: boolean;
  onSend: (content: string) => Promise<void>;
  onClose?: () => void;
  connection?: string;
}
export function ChatPanel({
  messages,
  privateChat,
  disabled,
  onSend,
  onClose,
  connection,
}: ChatPanelProps) {
  const [content, setContent] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await onSend(content.trim());
      setContent("");
    } catch (sendError) {
      setError((sendError as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside
      className={`${styles.panel} ${styles.chat}`}
      aria-label={
        privateChat ? "Conversación privada con Soflia" : "Chat en vivo"
      }
    >
      <div className={styles.chatHeader}>
        <span className={styles.actions}>
          {privateChat ? <Sparkles size={17} /> : <MessageSquare size={17} />}{" "}
          {privateChat ? "Soflia · privado" : "Chat en vivo"}
        </span>
        {onClose ? (
          <button aria-label="Cerrar Soflia" onClick={onClose}>
            <X size={17} />
          </button>
        ) : (
          <span className={styles.muted}>{connection}</span>
        )}
      </div>
      <div className={styles.messages} role="log" aria-live="polite">
        {!messages.length && (
          <p className={styles.muted}>
            {privateChat
              ? "Pregunta sobre la clase. Esta conversación solo es visible para ti."
              : "Sé parte de la conversación. Menciona @Soflia para preguntarle al asistente."}
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={styles.message}>
            <strong>
              {message.author_name}
              {message.created_at && (
                <time>
                  {new Date(message.created_at).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              )}
            </strong>
            {message.content}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form className={styles.composer} onSubmit={submit}>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <textarea
          aria-label={privateChat ? "Pregunta a Soflia" : "Mensaje al grupo"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={2}
          className={styles.input}
          placeholder={
            privateChat
              ? "¿Qué te gustaría entender?"
              : "Comparte una pregunta…"
          }
          disabled={disabled || busy}
        />
        <div className={styles.cardFooter}>
          <span className={styles.muted}>
            {privateChat
              ? "Chat + transcripción disponible"
              : "@Soflia participa contigo"}
          </span>
          <button
            className={styles.button}
            disabled={disabled || busy || !content.trim()}
            aria-label="Enviar mensaje"
          >
            <Send size={15} />
            {busy ? "…" : ""}
          </button>
        </div>
      </form>
    </aside>
  );
}
