/**
 * Entrega del resultado al escritorio.
 *
 * No se usa un 302 hacia `soflia://` porque varios navegadores bloquean el
 * salto automatico a un esquema externo cuando proviene de una redireccion del
 * servidor. Una pagina intermedia que lo intenta desde el documento funciona de
 * forma consistente y, sobre todo, deja un boton visible cuando el navegador
 * pide confirmacion o el intento silencioso no prospera.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildDesktopHandoffResponse(targetUrl: string): Response {
  const safeUrl = escapeHtml(targetUrl);
  // El destino se serializa como JSON para que no pueda romper el contexto de
  // script aunque en el futuro cambie su formato.
  const jsonUrl = JSON.stringify(targetUrl);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Volviendo a Pulse Hub</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; margin: 0; padding: 24px; text-align: center;
  }
  main { max-width: 28rem; }
  h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
  p { margin: 0 0 1.5rem; opacity: 0.75; line-height: 1.5; }
  a {
    display: inline-block; padding: 0.625rem 1.25rem; border-radius: 0.5rem;
    background: #4f46e5; color: #fff; text-decoration: none; font-weight: 500;
  }
</style>
</head>
<body>
<main>
  <h1>Volviendo a Pulse Hub</h1>
  <p>Ya puedes cerrar esta pestana. Si la aplicacion no se abrio sola, usa el boton.</p>
  <a id="continuar" href="${safeUrl}">Abrir Pulse Hub</a>
</main>
<script>
  window.location.href = ${jsonUrl};
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/html; charset=utf-8',
      // La pagina lleva el ticket en la URL: que ningun intermediario la guarde
      // ni la exponga como referente a terceros.
      'Referrer-Policy': 'no-referrer',
    },
    status: 200,
  });
}
