"use client";
import { useState } from "react";
import { BookOpen, ClipboardCheck, Paperclip } from "lucide-react";
import { liveFetch } from "./client";
import type { LiveActivity } from "./types";
import type { ActivityResponse } from "./ActivityPanel";
import styles from "./Live.module.css";
export function ActivityCard({
  activity,
  response,
  endpoint,
  disabled,
  perform,
}: {
  activity: LiveActivity;
  response?: ActivityResponse;
  endpoint: string;
  disabled: boolean;
  perform: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const [answer, setAnswer] = useState<number>();
  return (
    <article className={styles.activityCard}>
      <div className={styles.actions}>
        {activity.kind === "quiz" ? (
          <ClipboardCheck size={18} />
        ) : activity.kind === "file" ? (
          <Paperclip size={18} />
        ) : (
          <BookOpen size={18} />
        )}
        <h3>{activity.title}</h3>
      </div>
      <p>{activity.content}</p>
      {activity.kind === "quiz" &&
        activity.options.map((option, index) => (
          <label className={styles.option} key={index}>
            <input
              type="radio"
              name={activity.id}
              disabled={disabled || !!response}
              checked={(response?.answer ?? answer) === index}
              onChange={() => setAnswer(index)}
            />
            {option}
          </label>
        ))}
      {activity.kind === "file" ? (
        <button
          className={styles.secondary}
          onClick={() =>
            void perform(async () => {
              const result = await liveFetch<{ signedUrl: string }>(
                `${endpoint}/download`,
                { activity_id: activity.id },
              );
              window.location.assign(result.signedUrl);
            })
          }
        >
          Descargar archivo
        </button>
      ) : response ? (
        <p className={styles.notice}>
          {response.is_correct === null
            ? "Lectura completada"
            : response.is_correct
              ? "Respuesta correcta"
              : "Respuesta registrada. Revisa el tema con Soflia."}
        </p>
      ) : (
        <button
          className={styles.secondary}
          disabled={
            disabled || (activity.kind === "quiz" && answer === undefined)
          }
          onClick={() =>
            void perform(() =>
              liveFetch(`${endpoint}/respond`, {
                activity_id: activity.id,
                answer,
              }),
            )
          }
        >
          {activity.kind === "quiz" ? "Enviar respuesta" : "Marcar como leído"}
        </button>
      )}
    </article>
  );
}
