"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Radio, Sparkles } from "lucide-react";
import { LiveTheme } from "./LiveTheme";
import { ChatPanel } from "./ChatPanel";
import { ActivityPanel } from "./ActivityPanel";
import { useLiveRoom } from "./useLiveRoom";
import { liveFetch, statusLabel } from "./client";
import styles from "./Live.module.css";
const ZoomStage = dynamic(
  () => import("./ZoomStage").then((module) => module.ZoomStage),
  {
    ssr: false,
    loading: () => <div className={styles.video}>Preparando el aula…</div>,
  },
);
export function LiveRoom({
  orgSlug,
  sessionId,
}: {
  orgSlug: string;
  sessionId: string;
}) {
  const { endpoint, data, error, mutate, connection } = useLiveRoom(
    orgSlug,
    sessionId,
  );
  const [liaOpen, setLiaOpen] = useState(true),
    [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(false);
  async function changeStatus(status: string) {
    setBusy(true);
    setActionError("");
    try {
      await liveFetch(endpoint, { status }, "PATCH");
      await mutate();
    } catch (statusError) {
      setActionError((statusError as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <LiveTheme>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.actions}>
            <Link
              href={`/${orgSlug}/live`}
              aria-label="Volver a la agenda"
              className={styles.secondary}
            >
              <ArrowLeft size={17} />
            </Link>
            <div>
              <div className={styles.eyebrow}>
                <Radio size={14} /> Soflia In Live
              </div>
              <h1
                className={styles.title}
                style={{ fontSize: 22, marginBottom: 0 }}
              >
                {data?.session.title || "Aula en vivo"}
              </h1>
            </div>
          </div>
          <div className={styles.actions}>
            {data && (
              <span
                className={`${styles.badge} ${data.session.status === "live" ? styles.live : ""}`}
              >
                {statusLabel[data.session.status]}
              </span>
            )}
            <button
              onClick={() => setLiaOpen(!liaOpen)}
              className={styles.secondary}
              aria-pressed={liaOpen}
            >
              <Sparkles size={16} /> Soflia
            </button>
          </div>
        </header>
        {(error || actionError) && (
          <div role="alert" className={styles.error}>
            {error?.message || actionError}
          </div>
        )}
        {!data && !error && <p>Cargando la sesión…</p>}
        {data && (
          <div
            className={`${styles.room} ${liaOpen ? styles.roomWithLia : ""}`}
          >
            <ChatPanel
              messages={data.messages}
              connection={connection}
              disabled={data.session.status !== "live"}
              onSend={async (content) => {
                const result = await liveFetch<{ aiError?: string }>(
                  `${endpoint}/messages`,
                  { content },
                );
                await mutate();
                if (result.aiError) setActionError(result.aiError);
              }}
            />
            <section>
              <ZoomStage
                session={data.session}
                endpoint={endpoint}
                isHost={
                  data.canManage && data.userId === data.session.instructor_id
                }
                onChange={() => void mutate()}
              />
              <div className={styles.toolbar}>
                <p className={styles.muted}>
                  {data.latestTranscriptAt
                    ? `Último contexto de voz: ${new Date(data.latestTranscriptAt).toLocaleTimeString()}`
                    : "Soflia aún no recibe transcripción de voz."}
                </p>
                {data.canManage &&
                  ["scheduled", "live"].includes(data.session.status) && (
                    <button
                      disabled={busy}
                      className={styles.secondary}
                      onClick={() =>
                        void changeStatus(
                          data.session.status === "live"
                            ? "ended"
                            : "cancelled",
                        )
                      }
                    >
                      {data.session.status === "live"
                        ? "Finalizar sesión"
                        : "Cancelar sesión"}
                    </button>
                  )}
              </div>
              <ActivityPanel
                activities={data.activities}
                responses={data.responses}
                endpoint={endpoint}
                canManage={data.canManage}
                active={data.session.status === "live"}
                onChange={() => void mutate()}
              />
            </section>
            {liaOpen && (
              <ChatPanel
                privateChat
                onClose={() => setLiaOpen(false)}
                messages={data.privateHistory.flatMap((turn) => [
                  {
                    id: `${turn.id}:q`,
                    author_name: "Tú",
                    content: turn.question,
                  },
                  {
                    id: `${turn.id}:a`,
                    author_name: "Soflia",
                    content: turn.answer,
                  },
                ])}
                onSend={async (content) => {
                  await liveFetch(`${endpoint}/soflia`, {
                    content,
                    private: true,
                  });
                  await mutate();
                }}
              />
            )}
          </div>
        )}
      </div>
    </LiveTheme>
  );
}
