import type { OrganizationInvitationTemplateInput } from './types';

export function buildOrganizationInvitationText(
  input: OrganizationInvitationTemplateInput,
  customMessage?: string
) {
  return `
InvitaciÃ³n de ${input.organizationName} en SofLIA

Hola,

Has sido invitado/a a unirte a ${input.organizationName} en nuestra plataforma de capacitaciÃ³n y desarrollo profesional.

${customMessage ? `Mensaje del administrador:\n"${customMessage}"\n` : ''}

Para completar tu registro y configurar tu cuenta, accede al siguiente enlace:
${input.registerUrl}

INFORMACIÃ“N IMPORTANTE:
- Esta invitaciÃ³n tiene una validez de 7 dÃ­as.
- El enlace es de uso Ãºnico y personal.

Atentamente,
Equipo de SofLIA en colaboraciÃ³n con ${input.organizationName}

---
Este es un mensaje automÃ¡tico enviado a travÃ©s de SofLIA. Por favor, no respondas a este correo.
    `.trim();
}
