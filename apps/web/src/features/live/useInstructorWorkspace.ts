"use client";
import { useState, useRef, type FormEvent } from "react";
import useSWR from "swr";
import { liveFetch } from "./client";
import { scheduleSchema } from "./schemas";
import { liveValidationMessage } from "./validation-message";
import type { LiveCatalog } from "./types";
const scheduleInputSchema = scheduleSchema.omit({ request_id: true });
export function useInstructorWorkspace(orgSlug: string) {
  const requestId = useRef<string>("");
  const [page, setPage] = useState(0),
    [coursePage, setCoursePage] = useState(0),
    [instructorPage, setInstructorPage] = useState(0);
  const [filter, setFilter] = useState(""),
    [scheduleError, setScheduleError] = useState(""),
    [instructorError, setInstructorError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const {
    data,
    error: loadError,
    mutate,
  } = useSWR<LiveCatalog>(
    `/api/${orgSlug}/live?view=instructor&page=${page}&coursePage=${coursePage}&instructorPage=${instructorPage}${filter ? `&instructor=${encodeURIComponent(filter)}` : ""}`,
    liveFetch,
  );
  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      values = new FormData(form);
    setBusy(true);
    setScheduleError("");
    setNotice("");
    try {
      const starts = new Date(String(values.get("starts")));
      if (!Number.isFinite(starts.getTime()))
        throw new Error("Elige una fecha y hora futura para la sesión.");
      const input = scheduleInputSchema.safeParse({
        course_id: values.get("course"),
        title: values.get("title"),
        description: values.get("description"),
        starts_at: starts.toISOString(),
        duration_minutes: Number(values.get("duration")),
        session_type: values.get("session_type") || "meeting",
      });
      if (!input.success) throw new Error(liveValidationMessage(input.error));
      requestId.current ||= crypto.randomUUID();
      await liveFetch(`/api/${orgSlug}/live`, {
        request_id: requestId.current,
        ...input.data,
      });
      requestId.current = "";
      form.reset();
      await mutate();
      setNotice(
        "Sesión programada. Los alumnos del curso ya pueden abrirla en Soflia Hub desde su agenda.",
      );
    } catch (e) {
      setScheduleError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveInstructor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      values = new FormData(form);
    setBusy(true);
    setInstructorError("");
    setNotice("");
    try {
      await liveFetch(`/api/${orgSlug}/live/instructors`, {
        email: values.get("email"),
        revoke: values.get("revoke") === "on",
      });
      form.reset();
      await mutate();
      setNotice("Permisos de instructor actualizados.");
    } catch (e) {
      setInstructorError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return {
    data,
    loadError,
    scheduleError,
    instructorError,
    busy,
    notice,
    filter,
    setFilter,
    page,
    setPage,
    coursePage,
    setCoursePage,
    instructorPage,
    setInstructorPage,
    schedule,
    saveInstructor,
  };
}
