"use client";
export async function liveFetch<T>(
  url: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(
    url,
    body === undefined
      ? { cache: "no-store" }
      : {
          method,
          credentials: "same-origin",
          ...(body instanceof FormData
            ? { body }
            : {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              }),
        },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "No se pudo completar la solicitud");
  return data as T;
}
export const liveDate = (value: string) =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const statusLabel = {
  scheduled: "Próximamente",
  live: "En vivo",
  ended: "Finalizada",
  cancelled: "Cancelada",
};
