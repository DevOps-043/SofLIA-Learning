import type { ComponentInfo } from '../../types';

export const certificateVerifyComponents: ComponentInfo[] = [
      {
        name: 'VerifyCertificatePage',
        path: 'apps/web/src/app/certificates/verify/page.tsx',
        description: 'Verificación pública de certificados',
        props: [],
        commonErrors: ['Certificado no encontrado', 'Código inválido']
      }
    ];
