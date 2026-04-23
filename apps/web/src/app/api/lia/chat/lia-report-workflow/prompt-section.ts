import {
  BugReportDraftTokenPayload,
} from './types';
import { normalizeBugCategory, normalizeBugPriority } from './normalization';
import { readString } from './value-readers';

export function buildPendingBugReportPromptSection(
  draft: BugReportDraftTokenPayload
): string {
  const title = readString(draft.title) || 'Sin titulo tecnico';
  const description = readString(draft.description) || 'Sin descripcion tecnica.';
  const category = normalizeBugCategory(readString(draft.category));
  const priority = normalizeBugPriority(readString(draft.priority));

  return (
    '\n\n## Flujo Activo de Reporte Tecnico\n' +
    'Tienes un borrador de reporte pendiente de validacion del usuario. Todavia NO debes enviarlo al sistema de reportes.\n' +
    `- Titulo tecnico actual: ${title}\n` +
    `- Descripcion tecnica actual: ${description}\n` +
    `- Categoria actual: ${category}\n` +
    `- Prioridad actual: ${priority}\n` +
    'Si el usuario corrige, amplia o aclara el caso, debes actualizar el borrador con lenguaje tecnico claro, mostrar la nueva version al usuario y volver a pedir confirmacion explicita.\n' +
    'Si el usuario cambia de tema, responde normalmente y no generes ningun bloque oculto de reporte.\n' +
    'Cuando sigas en el flujo de reporte, al final de tu respuesta agrega el bloque oculto [[BUG_REPORT_DRAFT:{...}]] con el borrador actualizado y NO uses [[BUG_REPORT:{...}]].'
  );
}
