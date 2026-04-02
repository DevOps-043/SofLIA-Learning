import {
  ensureAbsoluteUrl,
  escapeHtml,
  getEmailAppUrl,
  getSofliaLogoUrl,
} from './email.utils';

interface PasswordResetTemplateInput {
  resetUrl: string;
  username: string;
  year?: number;
}

interface OrganizationInvitationTemplateInput {
  registerUrl: string;
  organizationName: string;
  customMessage?: string;
  organizationLogoUrl?: string;
  appUrl?: string;
  year?: number;
}

export function buildPasswordResetEmailContent(
  input: PasswordResetTemplateInput
) {
  const year = input.year ?? new Date().getFullYear();
  const safeUsername = escapeHtml(input.username);
  const safeResetUrl = escapeHtml(input.resetUrl);

  return {
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #44E5FF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin: 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #44E5FF, #0077A6);
            color: white !important;
            padding: 15px 35px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .link-box {
            background: #f8f9fa;
            border: 2px dashed #44E5FF;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 20px 0;
            word-break: break-all;
            color: #0077A6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SofLIA</div>
            <h1>Recuperación de Contraseña</h1>
          </div>

          <p>Hola <strong>${safeUsername}</strong>,</p>

          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${safeResetUrl}" class="button">
              Restablecer mi contraseña
            </a>
          </div>

          <p style="text-align: center; color: #666; font-size: 14px;">
            O copia y pega este enlace en tu navegador:
          </p>

          <div class="link-box">
            ${safeResetUrl}
          </div>

          <div class="warning">
            <strong>Importante:</strong>
            <ul>
              <li>Este enlace expira en <strong>1 hora</strong></li>
              <li>Solo puedes usar este enlace una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li>Tu contraseña actual permanece segura hasta que la cambies</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">
            Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
            Tu cuenta permanece segura.
          </p>

          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
            <p>&copy; ${year} SofLIA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Recuperación de Contraseña - SofLIA

Hola ${input.username},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
${input.resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora
- Solo puedes usar este enlace una vez
- Si no solicitaste este cambio, ignora este email

Si tienes problemas con el enlace, copia y pega la URL completa en tu navegador.

Saludos,
Equipo SofLIA

---
Este es un email automático, por favor no respondas a este mensaje.
    `.trim(),
  };
}

export function buildOrganizationInvitationEmailContent(
  input: OrganizationInvitationTemplateInput
) {
  const appUrl = input.appUrl || getEmailAppUrl();
  const year = input.year ?? new Date().getFullYear();
  const safeOrganizationName = escapeHtml(input.organizationName);
  const safeRegisterUrl = escapeHtml(input.registerUrl);
  const normalizedCustomMessage = input.customMessage?.trim();
  const safeCustomMessage = normalizedCustomMessage
    ? escapeHtml(normalizedCustomMessage)
    : '';
  const absoluteOrgLogoUrl = ensureAbsoluteUrl(input.organizationLogoUrl, appUrl);
  const safeOrgLogoUrl = absoluteOrgLogoUrl
    ? escapeHtml(absoluteOrgLogoUrl)
    : undefined;
  const safeSofliaLogoUrl = escapeHtml(getSofliaLogoUrl(appUrl));

  return {
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación - ${safeOrganizationName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            max-width: 580px;
            margin: 0 auto;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            margin: 40px auto;
            border-radius: 4px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #0A2540;
            padding: 40px;
            text-align: center;
          }
          .org-logo {
            max-height: 80px;
            max-width: 240px;
            width: auto;
            margin-bottom: 0;
          }
          .org-name {
            color: #ffffff;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .content {
            padding: 40px;
          }
          .title {
            color: #0A2540;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 24px 0;
            text-align: center;
          }
          .text {
            color: #4a4a4a;
            font-size: 16px;
            margin: 0 0 20px 0;
          }
          .custom-message {
            background-color: #f9fafb;
            border-left: 4px solid #00D4B3;
            padding: 20px 24px;
            margin: 32px 0;
            color: #4a4a4a;
            font-size: 15px;
            font-style: italic;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .button {
            display: inline-block;
            background-color: #0A2540;
            color: #ffffff !important;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 12px rgba(10, 37, 64, 0.2);
          }
          .divider {
            height: 1px;
            background-color: #eee;
            margin: 40px 0;
          }
          .link-label {
            color: #888;
            font-size: 13px;
            margin: 0 0 12px 0;
            text-align: center;
          }
          .link-box {
            background-color: #f9fafb;
            border: 1px solid #eee;
            padding: 16px;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 12px;
            word-break: break-all;
            color: #666;
            text-align: center;
          }
          .info-section {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 24px;
            margin: 40px 0 0 0;
          }
          .info-title {
            color: #1a1a1a;
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 16px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .info-list {
            margin: 0;
            padding: 0 0 0 20px;
            color: #666;
            font-size: 14px;
          }
          .info-list li {
            margin-bottom: 8px;
          }
          .footer {
            background-color: #ffffff;
            padding: 40px;
            text-align: center;
            border-top: 1px solid #eee;
          }
          .footer-logo {
            height: 32px;
            width: auto;
            margin-bottom: 16px;
          }
          .footer-text {
            color: #888;
            font-size: 12px;
            margin: 0 0 8px 0;
          }
          .footer-copyright {
            color: #aaa;
            font-size: 11px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            ${safeOrgLogoUrl ? `
              <img src="${safeOrgLogoUrl}" alt="${safeOrganizationName}" class="org-logo" />
            ` : `
              <p class="org-name">${safeOrganizationName}</p>
            `}
          </div>

          <div class="content">
            <h1 class="title">Invitación de ${safeOrganizationName}</h1>

            <p class="text">Hola,</p>

            <p class="text">Has sido invitado/a a unirte a <strong>${safeOrganizationName}</strong> en SofLIA, nuestra plataforma de aprendizaje y desarrollo continuo.</p>

            ${safeCustomMessage ? `
            <div class="custom-message">
              "${safeCustomMessage}"
            </div>
            ` : ''}

            <div class="button-container">
              <a href="${safeRegisterUrl}" class="button">Configurar mi cuenta</a>
            </div>

            <div class="divider"></div>

            <div class="link-section">
              <p class="link-label">Si el botón no funciona, copia y pega el siguiente enlace:</p>
              <div class="link-box">${safeRegisterUrl}</div>
            </div>

            <div class="info-section">
              <p class="info-title">Detalles de la invitación</p>
              <ul class="info-list">
                <li>Válida durante 7 días.</li>
                <li>Acceso exclusivo para tu correo electrónico.</li>
                <li>Plataforma segura impulsada por IA.</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p class="footer-text">Enviado a través de</p>
            <img src="${safeSofliaLogoUrl}" alt="SofLIA" class="footer-logo" />
            <p class="footer-text">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
            <p class="footer-copyright">&copy; ${year} SofLIA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Invitación de ${input.organizationName} en SofLIA

Hola,

Has sido invitado/a a unirte a ${input.organizationName} en nuestra plataforma de capacitación y desarrollo profesional.

${normalizedCustomMessage ? `Mensaje del administrador:\n"${normalizedCustomMessage}"\n` : ''}

Para completar tu registro y configurar tu cuenta, accede al siguiente enlace:
${input.registerUrl}

INFORMACIÓN IMPORTANTE:
- Esta invitación tiene una validez de 7 días.
- El enlace es de uso único y personal.

Atentamente,
Equipo de SofLIA en colaboración con ${input.organizationName}

---
Este es un mensaje automático enviado a través de SofLIA. Por favor, no respondas a este correo.
    `.trim(),
  };
}
