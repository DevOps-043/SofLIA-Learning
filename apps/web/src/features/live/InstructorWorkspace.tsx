"use client";

import Link from "next/link";

import {
  ArrowLeft,
  GraduationCap,
  Radio,
  Users,
  ClipboardCheck,
} from "lucide-react";

import { SessionCard } from "./LiveCatalog";
import { LiveTheme } from "./LiveTheme";
import styles from "./Live.module.css";
import { useInstructorWorkspace } from "./useInstructorWorkspace";
import { InstructorForms } from "./InstructorForms";
import { Pagination } from "./Pagination";

export function InstructorWorkspace({ orgSlug }: { orgSlug: string }) {
  const {
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
  } = useInstructorWorkspace(orgSlug);
  return (
    <LiveTheme>
      <div className={styles.shell}>
        <Link
          href={`/${orgSlug}/business-user/dashboard`}
          className={styles.secondary}
        >
          <ArrowLeft size={15} /> Mi aprendizaje
        </Link>
        <header className={styles.header} style={{ marginTop: 26 }}>
          <div>
            <div className={styles.eyebrow}>
              <GraduationCap size={16} /> Espacio del instructor
            </div>
            <h1 className={styles.title}>Comparte lo que sabes.</h1>
            <p className={styles.muted}>
              Tus cursos de Engine, tus sesiones y la participación de tus
              alumnos.
            </p>
          </div>
          <div className={styles.actions}>
            {data?.isAdmin && (
              <Link
                href={`/${orgSlug}/business-panel/dashboard`}
                className={styles.secondary}
              >
                Administración
              </Link>
            )}
            <Link href={`/${orgSlug}/live`} className={styles.secondary}>
              Mi agenda
            </Link>
          </div>
        </header>
        {(error || loadError) && (
          <div role="alert" className={styles.error}>
            {error || loadError.message}
          </div>
        )}
        {notice && (
          <p role="status" className={styles.notice}>
            {notice}
          </p>
        )}
        {!data && !loadError && <p>Cargando tu espacio…</p>}
        {data && (
          <>
            {data.isAdmin && (
              <label className={styles.actions}>
                Vista{" "}
                <select
                  aria-label="Filtrar por instructor"
                  className={styles.input}
                  style={{ maxWidth: 360 }}
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(0);
                    setCoursePage(0);
                  }}
                >
                  <option value="">Todos los instructores</option>
                  <option value={data.userId}>Mis cursos y sesiones</option>
                  {data.instructors
                    .filter((i) => i.user_id !== data.userId)
                    .map((i) => (
                      <option key={i.user_id} value={i.user_id}>
                        {i.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <div className={styles.stats}>
              {[
                [Radio, "Sesiones", data.stats.sessions],
                [Users, "Alumnos en el aula", data.stats.attendees],
                [Users, "Alumnos de tus cursos", data.stats.learners],
                [ClipboardCheck, "Cursos completados", data.stats.completed],
                [
                  ClipboardCheck,
                  "Avance promedio (%)",
                  data.stats.averageProgress,
                ],
                [
                  ClipboardCheck,
                  "Actividades respondidas",
                  data.stats.responses,
                ],
              ].map(([Icon, label, value]) => {
                const Glyph = Icon as typeof Radio;
                return (
                  <div
                    key={String(label)}
                    className={`${styles.panel} ${styles.stat}`}
                  >
                    <Glyph size={19} />
                    <strong>{String(value)}</strong>
                    <span className={styles.muted}>{String(label)}</span>
                  </div>
                );
              })}
            </div>
            <div className={styles.workspace}>
              <section>
                <h2 className={styles.sectionTitle}>Sesiones en vivo</h2>
                {data.sessions.length ? (
                  <div className={styles.grid}>
                    {data.sessions.map((s) => (
                      <SessionCard key={s.id} session={s} orgSlug={orgSlug} />
                    ))}
                  </div>
                ) : (
                  <div className={`${styles.panel} ${styles.empty}`}>
                    Programa tu primera sesión para reunir a tus alumnos.
                  </div>
                )}
                <Pagination
                  page={page}
                  total={data.total}
                  pageSize={20}
                  onChange={setPage}
                  label="Páginas de sesiones"
                />
                {data.isAdmin && (
                  <Pagination
                    page={instructorPage}
                    total={data.instructorTotal}
                    pageSize={50}
                    onChange={setInstructorPage}
                    label="Páginas del selector de instructores"
                  />
                )}
                <div className={styles.panel} style={{ marginTop: 22 }}>
                  <h2 className={styles.sectionTitle}>Cursos de Engine</h2>
                  <p className={styles.muted}>
                    La autoría se toma del instructor vinculado durante la
                    importación.
                  </p>
                  {data.courses.map((c) => (
                    <div key={c.id} className={styles.row}>
                      <span>{c.title}</span>
                      <span className={styles.badge}>
                        {c.instructor_id === data.userId
                          ? "Mi curso"
                          : "Instructor"}
                      </span>
                    </div>
                  ))}
                  {!data.courses.length && (
                    <p className={styles.empty}>
                      Todavía no hay cursos vinculados.
                    </p>
                  )}
                  <Pagination
                    page={coursePage}
                    total={data.courseTotal}
                    pageSize={50}
                    onChange={setCoursePage}
                    label="Páginas de cursos"
                  />
                </div>
              </section>
              <InstructorForms
                data={data}
                busy={busy}
                schedule={schedule}
                saveInstructor={saveInstructor}
              />
            </div>
          </>
        )}
      </div>
    </LiveTheme>
  );
}
