/**
 * Spinner de ruta a pantalla completa, reutilizado por los `loading.tsx` de los
 * segmentos pesados (admin, business-panel, business-user).
 *
 * Proposito: en el App Router, un `loading.tsx` envuelve el segmento en un
 * <Suspense> y se muestra de inmediato al navegar, mientras se resuelve el RSC
 * (middleware + data del server). Sin el, la pagina anterior queda congelada y la
 * navegacion se siente como un cuelgue. Sin texto, para no depender de i18n
 * (que es client-side) en el limite de servidor.
 */
export function RouteLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-accent/20 border-t-accent motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status"
        aria-label="Cargando"
      >
        <span className="absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
          Cargando...
        </span>
      </div>
    </div>
  )
}
