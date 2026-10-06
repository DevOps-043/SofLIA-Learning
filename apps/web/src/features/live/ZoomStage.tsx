"use client";
import { useEffect, useRef, useState } from "react";
import { Video, MonitorUp } from "lucide-react";
import type { EmbeddedClient, JoinOptions } from "@zoom/meetingsdk/embedded";
import type { LiveSession } from "./types";
import { liveFetch } from "./client";
import styles from "./Live.module.css";

interface ZoomStageProps {
  session: LiveSession;
  endpoint: string;
  isHost: boolean;
  onChange: () => void;
}
export function ZoomStage({
  session,
  endpoint,
  isHost,
  onChange,
}: ZoomStageProps) {
  const root = useRef<HTMLDivElement>(null);
  const client = useRef<typeof EmbeddedClient | null>(null);
  const [joining, setJoining] = useState(false),
    [joined, setJoined] = useState(false),
    [error, setError] = useState("");
  const disposed = useRef(false);
  const captureReady = useRef(false);
  const destroyClient = useRef<(() => void) | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    disposed.current = false;
    return () => {
      disposed.current = true;
      captureReady.current = false;
      if (client.current) {
        void client.current
          .leaveMeeting()
          .catch(() => undefined)
          .finally(() => destroyClient.current?.());
        client.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (!joined || session.status !== "live") return;
    const report = () => {
      void liveFetch(`${endpoint}/attendance`, {}).catch(() =>
        setError("No se pudo registrar tu presencia en el aula."),
      );
    };
    report();
    const timer = setInterval(report, 60000);
    return () => clearInterval(timer);
  }, [joined, session.status, endpoint]);
  async function join() {
    if (!root.current || joining || joined) return;
    setJoining(true);
    setError("");
    try {
      const options = await liveFetch<JoinOptions>(`${endpoint}/join`, {});
      const Zoom = (await import("@zoom/meetingsdk/embedded")).default;
      if (disposed.current) return;
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
        throw new Error(
          "El aula integrada de Zoom requiere un navegador de escritorio.",
        );
      const meeting = Zoom.createClient();
      destroyClient.current = () => Zoom.destroyClient();
      client.current = meeting;
      await meeting.init({
        zoomAppRoot: root.current,
        language: "es-ES",
        patchJsMedia: true,
        leaveOnPageUnload: true,
      });
      meeting.on("caption-message", (caption) => {
        if (
          !isHost ||
          !captureReady.current ||
          !caption.done ||
          !caption.text.trim()
        )
          return;
        void liveFetch(`${endpoint}/transcript`, {
          source_id: caption.msgId,
          speaker: caption.displayName,
          content: caption.text,
          spoken_at: new Date(caption.timestamp).toISOString(),
        }).catch(() =>
          setError(
            "No se está guardando la transcripción. Soflia podría tener contexto de voz incompleto.",
          ),
        );
      });
      meeting.on("connection-change", (event) => {
        if (event.state === "Closed") {
          setJoined(false);
          captureReady.current = false;
          onChangeRef.current();
        }
      });
      await meeting.join(options);
      if (disposed.current) {
        await meeting.leaveMeeting();
        return;
      }
      if (isHost && session.status === "scheduled")
        await liveFetch(endpoint, { status: "live" }, "PATCH");
      captureReady.current = isHost;
      setJoined(true);
      onChangeRef.current();
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "No fue posible entrar a Zoom",
      );
      if (client.current) {
        await client.current.leaveMeeting().catch(() => undefined);
        destroyClient.current?.();
        client.current = null;
      }
    } finally {
      if (!disposed.current) setJoining(false);
    }
  }
  const closed = ["ended", "cancelled"].includes(session.status);
  return (
    <div className={styles.video}>
      {!joined && (
        <div className={styles.videoPlaceholder}>
          <Video size={42} />
          <span className={styles.badge}>Aula In Live</span>
          <h2 className={styles.sectionTitle}>{session.title}</h2>
          <p className={styles.muted}>
            {closed
              ? "Esta sesión ha concluido. Puedes consultar el chat y los materiales."
              : isHost
                ? "Inicia la reunión para recibir a tus alumnos."
                : "Conecta con tu instructor y aprende junto a tu grupo."}
          </p>
          {!closed && (
            <button
              className={styles.button}
              onClick={join}
              disabled={joining || (!isHost && session.status !== "live")}
            >
              {joining
                ? "Conectando con Zoom…"
                : isHost
                  ? "Iniciar / entrar como anfitrión"
                  : "Entrar a la sesión"}
            </button>
          )}
          {isHost && !closed && (
            <p className={styles.muted}>
              <MonitorUp size={14} style={{ display: "inline" }} /> Audio,
              cámara y compartir pantalla estarán en los controles de Zoom.
              Activa los subtítulos para dar contexto de voz a Soflia.
            </p>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div
        ref={root}
        className={styles.zoomRoot}
        style={!joined && !joining ? { minHeight: 0 } : undefined}
      />
    </div>
  );
}
