import type { NanoBananaSchema } from './types';

export const UI_MOBILE_APP_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'ui', style: 'modern-minimal', outputFormat: 'wireframe', version: '1.0',
    createdAt: new Date().toISOString(), title: 'Mobile App Template',
    description: 'Plantilla base para aplicaciones móviles',
  },
  scene: {
    id: 'scene_mobile_app', description: 'Aplicación móvil con navegación estándar',
    environment: {
      lighting: 'ambient', background: 'var(--color-legacy-121212)', mood: 'professional',
      colorScheme: 'dark', primaryColor: 'var(--color-legacy-6366f1)', secondaryColor: 'var(--color-legacy-1e1e2e)', accentColor: 'var(--color-legacy-22d3ee)',
    },
    dimensions: { width: '375px', height: '812px' },
  },
  entities: [
    {
      id: 'nav_status_bar', type: 'component', name: 'Status Bar', position: 'top', emphasis: 'background',
      properties: { height: '44px', backgroundColor: 'transparent', elements: ['time', 'signal', 'battery'] },
    },
    {
      id: 'nav_header', type: 'component', name: 'Header', position: 'top', emphasis: 'primary',
      properties: {
        height: '56px', backgroundColor: 'var(--color-legacy-1e1e2e)', actions: ['back', 'menu'],
        title: { text: 'App Title', fontSize: '18px', fontWeight: '600', color: 'var(--color-bg-light)' },
      },
    },
    {
      id: 'content_main', type: 'container', name: 'Main Content Area', position: 'center', emphasis: 'primary',
      properties: { flex: 1, padding: '16px', backgroundColor: 'var(--color-legacy-121212)', scrollable: true }, children: [],
    },
    {
      id: 'nav_bottom', type: 'component', name: 'Bottom Navigation', position: 'bottom', emphasis: 'primary',
      properties: {
        height: '56px', backgroundColor: 'var(--color-legacy-1e1e2e)',
        items: [
          { id: 'nav_home', icon: 'home', label: 'Inicio', active: true },
          { id: 'nav_search', icon: 'search', label: 'Buscar', active: false },
          { id: 'nav_profile', icon: 'user', label: 'Perfil', active: false },
        ],
      },
    },
  ],
  constraints: {
    accessibility: { minTouchTarget: '44px', contrastRatio: '4.5:1', colorBlindSafe: true, focusIndicators: true },
    technicalRequirements: { safeAreaInsets: true, notchSupport: true },
  },
};
