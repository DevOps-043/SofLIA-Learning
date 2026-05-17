import type { Categoria, Prioridad, ReporteProblemProps } from './types';

interface BuildReportPayloadParams {
  categoria: Categoria;
  comportamientoEsperado: string;
  descripcion: string;
  fromLia: boolean;
  pasosReproducir: string;
  prioridad: Prioridad;
  reportContext: ReporteProblemProps['reportContext'];
  screenshotData: string | null;
  titulo: string;
}

export function buildReportPayload(params: BuildReportPayloadParams) {
  const navegador = navigator.userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[0] || 'Desconocido';

  return {
    titulo: params.titulo.trim(),
    descripcion: params.descripcion.trim(),
    categoria: params.categoria,
    prioridad: params.prioridad,
    pagina_url: window.location.href,
    pathname: window.location.pathname,
    user_agent: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    navegador,
    pasos_reproducir: params.pasosReproducir.trim() || null,
    comportamiento_esperado: params.comportamientoEsperado.trim() || null,
    screenshot_data: params.screenshotData,
    from_lia: params.fromLia,
    report_context: params.reportContext,
  };
}
