"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { fetchRecording } from "./client";
import { recordingResponseSchema, type RecordingResponse } from "./contract";
import styles from "../Live.module.css";
export function RecordingPlayer({
  endpoint,
  runId,
  userId,
}: {
  endpoint: string;
  runId: string;
  userId:string;
}) {
  const [playback, setPlayback] = useState<RecordingResponse["playback"]>(),
    [segment, setSegment] = useState(0),
    [error, setError] = useState("");
  const video = useRef<HTMLVideoElement | null>(null),
    position = useRef(0),
    playing = useRef(false),
    busy = useRef(false),
    failed = useRef(false),
    alive = useRef(false);
  const load = useCallback(
    (manual = false) => {
      if (busy.current || (failed.current && !manual)) return Promise.resolve();
      busy.current = true;
      return fetchRecording(endpoint,userId, { type: "play", run_id: runId })
        .then((result) => {
          if (!alive.current) return;
          const parsed = recordingResponseSchema.parse(result);
          if (!parsed.playback)
            throw new Error("La grabación no está disponible.");
          setPlayback(parsed.playback);
          setError("");
          failed.current = false;
        })
        .catch(() => {
          failed.current = true;
          if (alive.current) {
            setPlayback(undefined);
            setError(
              "No pudimos reproducir el vídeo. Tu acceso pudo cambiar; vuelve a intentar.",
            );
          }
        })
        .finally(() => {
          busy.current = false;
        });
    },
    [endpoint, runId,userId],
  );
  useEffect(() => {
    let disposed = false;
    alive.current = true;
    void fetchRecording(endpoint,userId, { type: "play", run_id: runId })
      .then((result) => {
        if (!disposed)
          setPlayback(recordingResponseSchema.parse(result).playback);
      })
      .catch(() => {
        if (!disposed) {
          failed.current = true;
          setError("Esta grabación no está disponible.");
        }
      });
    return () => {
      disposed = true;
      alive.current = false;
    };
  }, [endpoint, runId,userId]);
  const ownVideo = useCallback((element: HTMLVideoElement | null) => {
    if (!element && video.current) {
      video.current.pause();
      video.current.removeAttribute("src");
      video.current.load();
    }
    video.current = element;
  }, []);
  function renew() {
    if (playback && Date.now() > Date.parse(playback.expires_at) - 20000)
      void load();
  }
  const item = playback?.segments[segment];
  return (
    <div style={{ marginTop: 16 }}>
      {error && (
        <p role="alert">
          {error}
          <button className={styles.secondary} onClick={() => void load(true)}>
            Reintentar reproducción
          </button>
        </p>
      )}
      {item ? (
        <video
          ref={ownVideo}
          src={item.url}
          aria-label="Repetición del webinar"
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", borderRadius: 12 }}
          onTimeUpdate={(event) => {
            position.current = event.currentTarget.currentTime;
            renew();
          }}
          onPlay={() => {
            playing.current = true;
          }}
          onPause={(event) => {
            if (event.currentTarget.readyState) playing.current = false;
          }}
          onLoadedMetadata={(event) => {
            event.currentTarget.currentTime = Math.min(
              position.current,
              event.currentTarget.duration || 0,
            );
            if (playing.current)
              void event.currentTarget.play().catch(() => {});
          }}
          onError={() => void load()}
          onEnded={() => {
            position.current = 0;
            playing.current = true;
            setSegment((current) =>
              Math.min(current + 1, (playback?.segments.length || 1) - 1),
            );
          }}
        />
      ) : (
        !error && <p role="status">Preparando reproducción privada…</p>
      )}
      {(playback?.segments.length || 0) > 1 && (
        <div className={styles.actions}>
          {playback?.segments.map((item, index) => (
            <button
              key={item.id}
              className={styles.secondary}
              aria-pressed={segment === index}
              onClick={() => {
                position.current = 0;
                setSegment(index);
              }}
            >
              Parte {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
