import type { ComponentInfo } from '../../types';

export const certificatesListComponents: ComponentInfo[] = [
      {
        name: 'CertificatesPage',
        path: 'apps/web/src/app/certificates/page.tsx',
        description: 'Lista de certificados obtenidos',
        props: [],
        commonErrors: ['Certificados no cargan', 'PDF no genera']
      },
      {
        name: 'CertificateCard',
        path: 'apps/web/src/features/certificates/components/CertificateCard.tsx',
        description: 'Tarjeta de certificado individual',
        props: ['certificate', 'onDownload', 'onShare'],
        commonErrors: ['Imagen no carga', 'Descarga falla']
      }
    ];
