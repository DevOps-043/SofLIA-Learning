// Precarga (warm-up) del chunk perezoso del formulario de autenticación.
//
// `/auth` carga `AuthTabs` con `dynamic(..., { ssr: false })`, así que el
// prefetch de ruta de Next NO trae ese chunk: al navegar aparecería un segundo
// spinner mientras descarga. Disparando esta función al pasar el cursor / enfocar
// el botón "Acceso clientes", el chunk ya está listo y el login se muestra
// instantáneamente. Idempotente: solo precarga una vez.

let warmed = false;

export function warmClientAccess(): void {
  if (warmed || typeof window === 'undefined') return;
  warmed = true;
  void import('@/features/auth/components/AuthTabs').catch(() => {
    // Si falla, permitimos reintentar en el próximo hover.
    warmed = false;
  });
}
