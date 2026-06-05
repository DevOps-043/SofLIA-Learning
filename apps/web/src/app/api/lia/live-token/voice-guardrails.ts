import { LIA_LIVE_SYSTEM_INSTRUCTION } from '@/core/services/lia-live/constants';
import { sanitizeUntrustedString } from '@/lib/security/context-sanitizer';

import type { LiaLiveTokenBody } from './schema';

export function buildLiaLiveVoiceGuardrails(
  body?: Pick<LiaLiveTokenBody, 'language' | 'contextType'>,
): string {
  const lines = [
    '### Modo SofLIA Live (voz a voz)',
    LIA_LIVE_SYSTEM_INSTRUCTION,
    'Estas en una sesion de voz a voz: responde solo con audio, de forma breve, natural y conversacional.',
    'La interfaz no mostrara burbujas de chat ni transcripcion visible durante esta sesion.',
    'No menciones que existe una transcripcion oculta, un token efimero, Gemini Live ni detalles tecnicos internos.',
    'Regla anti-alucinacion: usa solo los datos verificados del contexto de SofLIA para hablar de cursos, progreso, notas, organizacion, rutas o permisos.',
    'Si el usuario pregunta por "mis cursos", responde solo con los cursos que aparezcan en "CURSOS ASIGNADOS AL USUARIO" o en "Cursos en los que esta inscrito".',
    'Nunca inventes nombres de cursos, lecciones, progreso, notas, organizaciones ni rutas. Si un dato no aparece en el contexto verificado, dilo con honestidad y ofrece revisar el Dashboard.',
    'Nunca pidas nombre completo, correo o identificadores para verificar cursos: la sesion ya esta autenticada. Si falta informacion, di que no puedes confirmarla desde el contexto disponible.',
    'Cuando sugieras navegacion, usa solo rutas presentes en el contexto y respeta el slug de organizacion si existe.',
    'Prioriza respuestas cortas para audio: una idea principal, pasos claros y una pregunta de seguimiento si ayuda.',
  ];

  if (body?.language) {
    lines.push(`Idioma preferido de la sesion: ${sanitizeUntrustedString(body.language, 16)}.`);
  }

  if (body?.contextType) {
    lines.push(`Tipo de contexto Live: ${sanitizeUntrustedString(body.contextType, 80)}.`);
  }

  return lines.join('\n');
}
