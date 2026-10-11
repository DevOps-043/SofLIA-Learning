"use client";
import { useState, useRef, type FormEvent } from "react";
import useSWR from "swr";
import { liveFetch } from "./client";
import type { LiveCatalog } from "./types";
export function useInstructorWorkspace(orgSlug: string) {
  const requestId = useRef<string>("");
  const [page, setPage] = useState(0),
    [coursePage, setCoursePage] = useState(0),
    [instructorPage, setInstructorPage] = useState(0);
  const [filter, setFilter] = useState(""),
    [error, setError] = useState(""),
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
    setError("");
    setNotice("");
    try {
      requestId.current ||= crypto.randomUUID();
      await liveFetch(`/api/${orgSlug}/live`, {
        request_id: requestId.current,
        course_id: values.get("course"),
        title: values.get("title"),
        description: values.get("description"),
        starts_at: new Date(String(values.get("starts"))).toISOString(),
        duration_minutes: Number(values.get("duration")),
        session_type: values.get("session_type") || "meeting",
      });
      requestId.current = "";
      form.reset();
      await mutate();
      setNotice(
        "Sesión programada. Los alumnos del curso ya pueden abrirla en Soflia Hub desde su agenda.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveInstructor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      values = new FormData(form);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await liveFetch(`/api/${orgSlug}/live/instructors`, {
        email: values.get("email"),
        zoom_user_id: values.get("zoom"),
        revoke: values.get("revoke") === "on",
      });
      form.reset();
      await mutate();
      setNotice("Permisos de instructor actualizados.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return {
    data,
    loadError,
    error,
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
