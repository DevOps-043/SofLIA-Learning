import type { ZodError } from "zod";

const fieldMessages: Record<string, string> = {
  course_id: "Selecciona un curso válido de tu autoría.",
  title: "Escribe un título de entre 1 y 160 caracteres.",
  description: "La descripción admite hasta 4000 caracteres.",
  starts_at: "Elige una fecha y hora futura para la sesión.",
  duration_minutes:
    "La duración debe ser un número entero entre 15 y 480 minutos.",
  session_type: "Selecciona Reunión o Webinar como tipo de sesión.",
  email: "Escribe un correo válido para el usuario de Soflia.",
  zoom_user_id: "Escribe el correo o ID del anfitrión de Zoom.",
};

/** Solo devuelve mensajes propios; no expone valores ni mensajes de entrada. */
export function liveValidationMessage(error: ZodError): string {
  const messages = error.issues.map((issue) =>
    Object.hasOwn(fieldMessages, String(issue.path[0]))
      ? fieldMessages[String(issue.path[0])]
      : "Revisa los datos enviados.",
  );
  return [...new Set(messages)].join(" ") || "Revisa los datos enviados.";
}
