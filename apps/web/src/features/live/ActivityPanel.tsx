"use client";
import { useState, type FormEvent } from "react";
import { Paperclip } from "lucide-react";
import type { LiveActivity } from "./types";
import { liveFetch } from "./client";
import { ActivityCard } from "./ActivityCard";
import styles from "./Live.module.css";
export interface ActivityResponse {
  activity_id: string;
  answer: number | null;
  is_correct: boolean | null;
}
export function ActivityPanel({
  activities,
  responses,
  endpoint,
  canManage,
  active,
  onChange,
}: {
  activities: LiveActivity[];
  responses: ActivityResponse[];
  endpoint: string;
  canManage: boolean;
  active: boolean;
  onChange: () => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [kind, setKind] = useState("reading");
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      onChange();
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      values = new FormData(form);
    await perform(async () => {
      await liveFetch(`${endpoint}/activities`, {
        kind,
        title: values.get("title"),
        content: values.get("content"),
        options:
          kind === "quiz"
            ? String(values.get("options"))
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        ...(kind === "quiz"
          ? { correct_option: Number(values.get("correct")) - 1 }
          : {}),
      });
      form.reset();
    });
  }
  return (
    <section className={`${styles.panel} ${styles.activity}`}>
      <h2 className={styles.sectionTitle}>Actividades y materiales</h2>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.activityList}>
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            response={responses.find((r) => r.activity_id === activity.id)}
            endpoint={endpoint}
            disabled={!active || busy}
            perform={perform}
          />
        ))}
      </div>
      {!activities.length && (
        <p className={styles.muted}>
          Las lecturas, archivos y quizzes del instructor aparecerán aquí.
        </p>
      )}
      {canManage && (
        <details style={{ marginTop: 20 }}>
          <summary className={styles.secondary}>
            Publicar una actividad o archivo
          </summary>
          <form
            className={styles.form}
            onSubmit={publish}
            style={{ marginTop: 16 }}
          >
            <label>
              Tipo
              <select
                className={styles.input}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="reading">Lectura</option>
                <option value="quiz">Quiz</option>
              </select>
            </label>
            <label>
              Título
              <input
                name="title"
                className={styles.input}
                maxLength={180}
                required
              />
            </label>
            <label>
              {kind === "quiz" ? "Pregunta" : "Contenido"}
              <textarea
                name="content"
                className={styles.input}
                maxLength={8000}
                required
                rows={3}
              />
            </label>
            {kind === "quiz" && (
              <>
                <label>
                  Opciones (una por línea, de 2 a 6)
                  <textarea
                    className={styles.input}
                    name="options"
                    required
                    rows={4}
                  />
                </label>
                <label>
                  Número de la respuesta correcta
                  <input
                    type="number"
                    name="correct"
                    className={styles.input}
                    min={1}
                    max={6}
                    required
                  />
                </label>
              </>
            )}
            <button className={styles.button} disabled={busy || !active}>
              Publicar actividad
            </button>
          </form>
          <label className={styles.secondary} style={{ marginTop: 16 }}>
            <Paperclip size={15} /> Adjuntar PDF o imagen (hasta 10 MB)
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              disabled={busy || !active}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.set("file", file);
                void perform(() => liveFetch(`${endpoint}/upload`, form));
                event.target.value = "";
              }}
            />
          </label>
        </details>
      )}
    </section>
  );
}
