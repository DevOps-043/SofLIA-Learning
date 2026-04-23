export function buildBugConfirmationMessage(params: {
  recordingUrl: string | null;
  recordingStatus: string | null;
  hasImageEvidence: boolean;
  attachmentUploadWarnings: string[];
}): string {
  const { recordingUrl, recordingStatus, hasImageEvidence, attachmentUploadWarnings } = params;

  if (recordingUrl && hasImageEvidence) {
    return 'Reporte confirmado y enviado con evidencia visual y grabacion de sesion. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
  }
  if (recordingUrl) {
    return 'Reporte confirmado y enviado con grabacion de sesion. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
  }
  if (hasImageEvidence && attachmentUploadWarnings.length === 0) {
    return 'Reporte confirmado y enviado con evidencia visual adjunta. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
  }
  if (recordingStatus === 'unavailable') {
    return 'Reporte confirmado y enviado. La grabacion de pantalla no estaba disponible, pero el detalle tecnico validado ya quedo registrado para el equipo.';
  }
  if (recordingStatus === 'error' || recordingStatus === 'inactive') {
    return 'Reporte confirmado y enviado. No pudimos conservar la grabacion de pantalla, pero el detalle tecnico validado ya quedo registrado para el equipo.';
  }
  return 'Reporte confirmado y enviado correctamente. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.';
}
