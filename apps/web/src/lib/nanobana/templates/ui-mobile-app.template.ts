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
      lighting: 'ambient', background: '#121212', mood: 'professional',
      colorScheme: 'dark', primaryColor: '#6366F1', secondaryColor: '#1E1E2E', accentColor: '#22D3EE',
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
        height: '56px', backgroundColor: '#1E1E2E', actions: ['back', 'menu'],
        title: { text: 'App Title', fontSize: '18px', fontWeight: '600', color: '#FFFFFF' },
      },
    },
    {
      id: 'content_main', type: 'container', name: 'Main Content Area', position: 'center', emphasis: 'primary',
      properties: { flex: 1, padding: '16px', backgroundColor: '#121212', scrollable: true }, children: [],
    },
    {
      id: 'nav_bottom', type: 'component', name: 'Bottom Navigation', position: 'bottom', emphasis: 'primary',
      properties: {
        height: '56px', backgroundColor: '#1E1E2E',
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
