import type { NanoBananaEntity, NanoBananaSchema } from './types';

const sidebarChildren: NanoBananaEntity[] = [
  { id: 'sidebar_logo', type: 'component', name: 'Logo', position: 'top', emphasis: 'primary', properties: { height: '40px', marginBottom: '32px' } },
  {
    id: 'sidebar_nav', type: 'component', name: 'Navigation Menu', position: 'top', emphasis: 'primary',
    properties: {
      items: [
        { id: 'menu_dashboard', icon: 'grid', label: 'Dashboard', active: true },
        { id: 'menu_analytics', icon: 'chart', label: 'Analytics', active: false },
        { id: 'menu_users', icon: 'users', label: 'Usuarios', active: false },
        { id: 'menu_settings', icon: 'cog', label: 'Configuración', active: false },
      ],
    },
  },
];

const contentChildren: NanoBananaEntity[] = [
  {
    id: 'header_page', type: 'component', name: 'Page Header', position: 'top', emphasis: 'primary',
    properties: { title: 'Dashboard', subtitle: 'Bienvenido de vuelta' },
  },
  {
    id: 'grid_metrics', type: 'container', name: 'Metrics Grid', position: 'top', emphasis: 'primary', children: [] as NanoBananaEntity[],
    properties: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginTop: '24px' },
  },
];

export const UI_DASHBOARD_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'ui', style: 'corporate-modern', outputFormat: 'wireframe', version: '1.0',
    createdAt: new Date().toISOString(), title: 'Dashboard Template',
    description: 'Plantilla base para dashboards administrativos',
  },
  scene: {
    id: 'scene_dashboard', description: 'Dashboard con sidebar y métricas',
    environment: {
      lighting: 'ambient', background: 'var(--color-legacy-0f172a)', mood: 'professional',
      colorScheme: 'dark', primaryColor: 'var(--color-info)', secondaryColor: 'var(--color-legacy-1e293b)', accentColor: 'var(--color-success)',
    },
    dimensions: { width: '1440px', height: '900px' },
  },
  entities: [
    {
      id: 'sidebar_main', type: 'container', name: 'Sidebar', position: 'left', emphasis: 'secondary',
      properties: { width: '280px', backgroundColor: 'var(--color-legacy-1e293b)', padding: '24px 16px' },
      children: sidebarChildren,
    },
    {
      id: 'content_main', type: 'container', name: 'Main Content', position: 'center', emphasis: 'primary',
      properties: { flex: 1, padding: '32px', backgroundColor: 'var(--color-legacy-0f172a)' },
      children: contentChildren,
    },
  ],
  constraints: {
    accessibility: { minTouchTarget: '44px', contrastRatio: '4.5:1', colorBlindSafe: true, ariaLabels: true },
  },
};
