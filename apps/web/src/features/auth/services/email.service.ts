import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logger } from '../../../lib/logger';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

/**
 * Servicio de envío de emails para autenticación
 *
 * Funcionalidades:
 * - Envío de emails de recuperación de contraseña
 * - Templates HTML y texto plano profesionales
 * - Validación de configuración SMTP
 * - Manejo robusto de errores
 * - Logging detallado para debugging
 */
class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  /**
   * Inicializa el transporter de Nodemailer con configuración SMTP
   */
  private initTransporter() {
    const config = this.getConfig();

    if (!this.isConfigured(config)) {
      logger.error('Email service not configured - check SMTP_* env variables');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          minVersion: 'TLSv1.2',
          ciphers: 'HIGH:!aNULL:!MD5',
        },
      });

      // Verificar conexión SMTP al inicializar
      this.transporter.verify((verifyError) => {
        if (verifyError) {
          logger.error('SMTP connection verification failed', verifyError);
          this.transporter = null;
        } else {
          logger.info('SMTP connection verified OK - ready to send emails');
        }
      });
    } catch (error) {
      logger.error('Error initializing email service', error);
      this.transporter = null;
    }
  }

  /**
   * Obtiene la configuración SMTP desde variables de entorno
   */
  private getConfig(): EmailConfig {
    return {
      host: process.env.SMTP_SERVER || process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USERNAME || process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
    };
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  private isConfigured(config: EmailConfig): boolean {
    return !!(config.host && config.user && config.pass);
  }

  /**
   * Verifica si el servicio de email está configurado y listo para usar
   */
  public isReady(): boolean {
    return this.transporter !== null;
  }


  /**
   * Envía email de recuperación de contraseña
   *
   * @param to - Email del destinatario
   * @param resetToken - Token de recuperación
   * @param username - Nombre del usuario
   * @returns Objeto con success y messageId
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    username: string
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const htmlContent = this.generatePasswordResetHTML(resetUrl, username);
    const textContent = this.generatePasswordResetText(resetUrl, username);

    try {
      const info = await this.transporter.sendMail({
        from: `"SofLIA" <noreply@soflia.ai>`,
        to,
        subject: 'Recuperación de Contraseña - SofLIA',
        text: textContent,
        html: htmlContent,
      });

      logger.info('Password reset email sent', {
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending password reset email', error);
      throw new Error('Error sending password reset email');
    }
  }

  /**
   * Genera el template HTML para el email de recuperación
   */
  private generatePasswordResetHTML(resetUrl: string, username: string): string {
    return `
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

          <p>Hola <strong>${username}</strong>,</p>

          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">
              Restablecer mi contraseña
            </a>
          </div>

          <p style="text-align: center; color: #666; font-size: 14px;">
            O copia y pega este enlace en tu navegador:
          </p>

          <div class="link-box">
            ${resetUrl}
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
            <p>&copy; ${new Date().getFullYear()} SofLIA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el template de texto plano para el email de recuperación
   */
  private generatePasswordResetText(resetUrl: string, username: string): string {
    return `
Recuperación de Contraseña - SofLIA

Hola ${username},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
${resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora
- Solo puedes usar este enlace una vez
- Si no solicitaste este cambio, ignora este email

Si tienes problemas con el enlace, copia y pega la URL completa en tu navegador.

Saludos,
Equipo SofLIA

---
Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
  }

  // ============================================================================
  // EMAILS DE INVITACIÓN A ORGANIZACIÓN
  // ============================================================================

  /**
   * Envía email de invitación a una organización
   *
   * @param to - Email del destinatario
   * @param invitationToken - Token de invitación (64 chars hex)
   * @param organizationName - Nombre de la organización
   * @param organizationSlug - Slug para la URL de registro
   * @param customMessage - Mensaje personalizado opcional del admin
   * @param organizationLogoUrl - URL del logo de la organización (opcional)
   * @returns Objeto con success y messageId
   */
  async sendOrganizationInvitationEmail(
    to: string,
    invitationToken: string,
    organizationName: string,
    organizationSlug: string,
    customMessage?: string,
    organizationLogoUrl?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const registerUrl = `${frontendUrl}/auth/${organizationSlug}/register?token=${invitationToken}`;

    const htmlContent = this.generateInvitationHTML(registerUrl, organizationName, customMessage, organizationLogoUrl);
    const textContent = this.generateInvitationText(registerUrl, organizationName, customMessage);

    try {
      const info = await this.transporter.sendMail({
        from: `"SofLIA" <noreply@soflia.ai>`,
        to,
        subject: `Invitación a ${organizationName}`,
        text: textContent,
        html: htmlContent,
      });

      logger.info('Organization invitation email sent', {
        messageId: info.messageId,
        organization: organizationName,
        to,
        timestamp: new Date().toISOString(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending organization invitation email', error);
      throw new Error('Error sending organization invitation email');
    }
  }

  /**
   * Genera el template HTML para el email de invitación
   * Diseño minimalista y formal sin emojis
   */
  private generateInvitationHTML(
    registerUrl: string,
    organizationName: string,
    customMessage?: string,
    organizationLogoUrl?: string
  ): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Helper para asegurar que la URL de la imagen sea absoluta
    const ensureAbsoluteUrl = (url?: string) => {
      if (!url) return undefined;
      // Si ya es absoluta (http/https), la mantenemos
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      // Si es relativa, la combiamos con la appUrl
      return `${appUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const absoluteOrgLogoUrl = ensureAbsoluteUrl(organizationLogoUrl);
    // Usa un placeholder real si estamos en localhost, ya que Gmail/Outlook bloquean `http://localhost...`
    const isLocalhost = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
    const SofLIALogoUrl = isLocalhost 
      ? 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/logo.png' // Placeholder si es local para que no salga "rota" en pruebas
      : `${appUrl}/Logo.png`;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación - ${organizationName}</title>
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
            ${absoluteOrgLogoUrl ? `
              <img src="${absoluteOrgLogoUrl}" alt="${organizationName}" class="org-logo" />
            ` : `
              <p class="org-name">${organizationName}</p>
            `}
          </div>

          <div class="content">
            <h1 class="title">Invitación de ${organizationName}</h1>
            
            <p class="text">Hola,</p>

            <p class="text">Has sido invitado/a a unirte a <strong>${organizationName}</strong> en SofLIA, nuestra plataforma de aprendizaje y desarrollo continuo.</p>

            ${customMessage ? `
            <div class="custom-message">
              "${customMessage}"
            </div>
            ` : ''}

            <div class="button-container">
              <a href="${registerUrl}" class="button">Configurar mi cuenta</a>
            </div>

            <div class="divider"></div>

            <div class="link-section">
              <p class="link-label">Si el botón no funciona, copia y pega el siguiente enlace:</p>
              <div class="link-box">${registerUrl}</div>
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
            <img src="${SofLIALogoUrl}" alt="SofLIA" class="footer-logo" />
            <p class="footer-text">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
            <p class="footer-copyright">&copy; ${new Date().getFullYear()} SofLIA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el template de texto plano para el email de invitación
   * Versión formal y minimalista
   */
  private generateInvitationText(
    registerUrl: string,
    organizationName: string,
    customMessage?: string
  ): string {
    return `
Invitación de ${organizationName} en SofLIA

Hola,

Has sido invitado/a a unirte a ${organizationName} en nuestra plataforma de capacitación y desarrollo profesional.

${customMessage ? `Mensaje del administrador:\n"${customMessage}"\n` : ''}

Para completar tu registro y configurar tu cuenta, accede al siguiente enlace:
${registerUrl}

INFORMACIÓN IMPORTANTE:
- Esta invitación tiene una validez de 7 días.
- El enlace es de uso único y personal.

Atentamente,
Equipo de SofLIA en colaboración con ${organizationName}

---
Este es un mensaje automático enviado a través de SofLIA. Por favor, no respondas a este correo.
    `.trim();
  }
}

// Exportar instancia única (singleton)
export const emailService = new EmailService();
