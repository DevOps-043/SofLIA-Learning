import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

// Configuración del transportador de correo
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email de destino para solicitudes de demo
const DEMO_REQUEST_EMAIL = 'ernesto.hernandez@ecosdeliderazgo.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, source, timestamp } = body;

    // Validación básica
    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Guardar en la base de datos
    const { data, error: dbError } = await supabase
      .from('landing_contacts')
      .insert({
        name,
        email,
        company,
        source: source || 'landing_cta',
        created_at: timestamp || new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving contact:', dbError);
      // Continuar con el envío de correo aunque falle la base de datos
    }

    // Enviar correo de notificación
    try {
      const transporter = createTransporter();

      // Fecha formateada
      const fechaSolicitud = new Date().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        dateStyle: 'full',
        timeStyle: 'short',
      });

      // URL base para el logo (usar la URL de producción)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://SOFLIA-plataforma.netlify.app';
      const logoUrl = `${baseUrl}/Logo.png`;

      // HTML del correo
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 100%); padding: 40px 30px; text-align: center;">
              <img src="${logoUrl}" alt="SOFLIA" style="height: 50px; margin-bottom: 15px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600;">
                Nueva Solicitud de Demo
              </h1>
              <p style="color: rgba(255,255,255,0.7); margin: 10px 0 0 0; font-size: 15px;">
                Plataforma de Capacitación en IA
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola Fernando,
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Has recibido una nueva solicitud de <strong>demo ejecutiva</strong> desde la landing page de SOFLIA.
              </p>

              <!-- Info Card -->
              <div style="background-color: #f8fafc; border-left: 4px solid #00D4B3; border-radius: 8px; padding: 25px; margin: 0 0 30px 0;">
                <h2 style="color: #0A2540; font-size: 18px; margin: 0 0 20px 0;">
                  Datos del Contacto
                </h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #6C757D; font-size: 14px; width: 120px;">Nombre:</td>
                    <td style="padding: 10px 0; color: #0A2540; font-size: 16px; font-weight: 600;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6C757D; font-size: 14px;">Empresa:</td>
                    <td style="padding: 10px 0; color: #0A2540; font-size: 16px; font-weight: 600;">${company}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6C757D; font-size: 14px;">Correo:</td>
                    <td style="padding: 10px 0;">
                      <a href="mailto:${email}" style="color: #00D4B3; font-size: 16px; font-weight: 600; text-decoration: none;">
                        ${email}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #6C757D; font-size: 14px;">Fecha:</td>
                    <td style="padding: 10px 0; color: #0A2540; font-size: 14px;">${fechaSolicitud}</td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:${email}?subject=Demo%20Ejecutiva%20SOFLIA%20-%20${encodeURIComponent(company)}&body=Hola%20${encodeURIComponent(name)},%0A%0AGracias%20por%20tu%20interés%20en%20SOFLIA.%20Me%20gustaría%20agendar%20una%20demo%20ejecutiva%20contigo.%0A%0A¿Qué%20horario%20te%20funcionaría%20mejor?" 
                   style="display: inline-block; background: linear-gradient(135deg, #00D4B3 0%, #10B981 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(0,212,179,0.3);">
                  Responder a ${name}
                </a>
              </div>

              <p style="color: #6C757D; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                Este correo fue generado automáticamente desde el formulario de la landing page.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #E9ECEF;">
              <p style="color: #6C757D; font-size: 12px; margin: 0;">
                Â© ${new Date().getFullYear()} SOFLIA - Plataforma de Capacitación en IA
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Texto plano como alternativa
      const textContent = `
        Nueva Solicitud de Demo Ejecutiva - SOFLIA
        
        Hola Fernando,
        
        Has recibido una nueva solicitud de demo ejecutiva desde la landing page de SOFLIA.
        
        DATOS DEL CONTACTO:
        - Nombre: ${name}
        - Empresa: ${company}
        - Correo: ${email}
        - Fecha: ${fechaSolicitud}
        
        Por favor, contacta a ${name} lo antes posible para agendar la demo.
        
        ---
        Este correo fue generado automáticamente desde el formulario de la landing page.
      `;

      await transporter.sendMail({
        from: `"SOFLIA Platform" <${process.env.SMTP_USER}>`,
        to: DEMO_REQUEST_EMAIL,
        subject: `Nueva Solicitud de Demo - ${company}`,
        text: textContent,
        html: htmlContent,
      });


    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // No retornar error al usuario, ya que el registro se guardó
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud recibida correctamente',
      data: { id: data?.id },
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
