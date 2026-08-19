import { NextRequest } from 'next/server';

import {
  handleSsoExchange,
  ssoExchangeOptionsResponse,
} from '@/lib/auth/sso-exchange-route';

/**
 * POST /api/auth/desktop/exchange
 *
 * Canjea el ticket de un solo uso por la prueba de acceso que Pulse Hub
 * convierte en sesion. La identidad sale siempre de la fila del ticket: un
 * correo o identificador enviado en el cuerpo se ignora.
 *
 * CORS abierto y SIN credenciales a proposito. El endpoint no se autentica por
 * cookie sino por la posesion del ticket y del verificador, asi que aceptar
 * cualquier origen no concede nada: un sitio hostil no tiene ninguno de los
 * dos. Admitir credenciales, en cambio, si abriria una via de CSRF.
 */

export async function OPTIONS() {
  return ssoExchangeOptionsResponse();
}

export async function POST(request: NextRequest) {
  return handleSsoExchange(request, 'code');
}
