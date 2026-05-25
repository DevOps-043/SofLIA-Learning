import type { NanoBananaDomain, NanoBananaSchema, OutputFormat } from './types'

const meta = (
  domain: NanoBananaDomain,
  style: string,
  outputFormat: OutputFormat,
  title: string,
  description: string,
) => ({ domain, style, outputFormat, version: '1.0', createdAt: new Date().toISOString(), title, description })

export const UI_MOBILE_APP_TEMPLATE: NanoBananaSchema = {
  meta: meta('ui', 'modern-minimal', 'wireframe', 'Mobile App Template', 'Plantilla base para aplicaciones moviles'),
  scene: { id: 'scene_mobile_app', description: 'Aplicacion movil con navegacion estandar', environment: { lighting: 'ambient', background: 'var(--color-legacy-121212)', mood: 'professional', colorScheme: 'dark', primaryColor: 'var(--color-legacy-6366f1)', secondaryColor: 'var(--color-legacy-1e1e2e)', accentColor: 'var(--color-legacy-22d3ee)' }, dimensions: { width: '375px', height: '812px' } },
  entities: [
    { id: 'nav_status_bar', type: 'component', name: 'Status Bar', properties: { height: '44px', backgroundColor: 'transparent', elements: ['time', 'signal', 'battery'] }, position: 'top', emphasis: 'background' },
    { id: 'nav_header', type: 'component', name: 'Header', properties: { height: '56px', backgroundColor: 'var(--color-legacy-1e1e2e)', title: { text: 'App Title', fontSize: '18px', fontWeight: '600', color: 'var(--color-bg-light)' }, actions: ['back', 'menu'] }, position: 'top', emphasis: 'primary' },
    { id: 'content_main', type: 'container', name: 'Main Content Area', properties: { flex: 1, padding: '16px', backgroundColor: 'var(--color-legacy-121212)', scrollable: true }, position: 'center', emphasis: 'primary', children: [] },
    { id: 'nav_bottom', type: 'component', name: 'Bottom Navigation', properties: { height: '56px', backgroundColor: 'var(--color-legacy-1e1e2e)', items: [{ id: 'nav_home', icon: 'home', label: 'Inicio', active: true }, { id: 'nav_search', icon: 'search', label: 'Buscar', active: false }, { id: 'nav_profile', icon: 'user', label: 'Perfil', active: false }] }, position: 'bottom', emphasis: 'primary' },
  ],
  constraints: { accessibility: { minTouchTarget: '44px', contrastRatio: '4.5:1', colorBlindSafe: true, focusIndicators: true }, technicalRequirements: { safeAreaInsets: true, notchSupport: true } },
}

export const UI_DASHBOARD_TEMPLATE: NanoBananaSchema = {
  meta: meta('ui', 'corporate-modern', 'wireframe', 'Dashboard Template', 'Plantilla base para dashboards administrativos'),
  scene: { id: 'scene_dashboard', description: 'Dashboard con sidebar y metricas', environment: { lighting: 'ambient', background: 'var(--color-legacy-0f172a)', mood: 'professional', colorScheme: 'dark', primaryColor: 'var(--color-info)', secondaryColor: 'var(--color-legacy-1e293b)', accentColor: 'var(--color-success)' }, dimensions: { width: '1440px', height: '900px' } },
  entities: [
    { id: 'sidebar_main', type: 'container', name: 'Sidebar', properties: { width: '280px', backgroundColor: 'var(--color-legacy-1e293b)', padding: '24px 16px' }, position: 'left', emphasis: 'secondary', children: [
      { id: 'sidebar_logo', type: 'component', name: 'Logo', properties: { height: '40px', marginBottom: '32px' }, position: 'top', emphasis: 'primary' },
      { id: 'sidebar_nav', type: 'component', name: 'Navigation Menu', properties: { items: [{ id: 'menu_dashboard', icon: 'grid', label: 'Dashboard', active: true }, { id: 'menu_analytics', icon: 'chart', label: 'Analytics', active: false }, { id: 'menu_users', icon: 'users', label: 'Usuarios', active: false }, { id: 'menu_settings', icon: 'cog', label: 'Configuracion', active: false }] }, position: 'top', emphasis: 'primary' },
    ] },
    { id: 'content_main', type: 'container', name: 'Main Content', properties: { flex: 1, padding: '32px', backgroundColor: 'var(--color-legacy-0f172a)' }, position: 'center', emphasis: 'primary', children: [
      { id: 'header_page', type: 'component', name: 'Page Header', properties: { title: 'Dashboard', subtitle: 'Bienvenido de vuelta' }, position: 'top', emphasis: 'primary' },
      { id: 'grid_metrics', type: 'container', name: 'Metrics Grid', properties: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginTop: '24px' }, position: 'top', emphasis: 'primary', children: [] },
    ] },
  ],
  constraints: { accessibility: { minTouchTarget: '44px', contrastRatio: '4.5:1', colorBlindSafe: true, ariaLabels: true } },
}

export const PHOTO_PRODUCT_TEMPLATE: NanoBananaSchema = {
  meta: meta('photo', 'commercial-clean', 'render', 'Product Photography', 'Plantilla para fotografia de productos'),
  scene: { id: 'scene_product_photo', description: 'Fotografia de producto en estudio', environment: { lighting: 'studio-three-point', background: 'var(--color-bg-light)', mood: 'clean-professional' } },
  entities: [
    { id: 'product_main', type: 'product', name: 'Main Product', properties: { material: 'default', reflectivity: 0.3, shadow: { enabled: true, softness: 0.5, opacity: 0.3 } }, position: 'center', emphasis: 'primary' },
    { id: 'light_key', type: 'light', name: 'Key Light', properties: { type: 'softbox', intensity: 1.0, color: 'var(--color-bg-light)', angle: 45, distance: 'medium' }, position: 'top-right', emphasis: 'background' },
    { id: 'light_fill', type: 'light', name: 'Fill Light', properties: { type: 'reflector', intensity: 0.5, color: 'var(--color-bg-light)', angle: -30 }, position: 'left', emphasis: 'background' },
    { id: 'light_rim', type: 'light', name: 'Rim Light', properties: { type: 'strip', intensity: 0.7, color: 'var(--color-bg-light)', angle: 135 }, position: 'top-left', emphasis: 'background' },
  ],
  constraints: { technicalRequirements: { aspectRatio: '1:1', resolution: '2000x2000', format: 'png', colorSpace: 'sRGB' } },
}

export const PHOTO_LIFESTYLE_TEMPLATE: NanoBananaSchema = {
  meta: meta('photo', 'lifestyle-aspirational', 'render', 'Lifestyle Photography', 'Plantilla para fotografia lifestyle/marketing'),
  scene: { id: 'scene_lifestyle', description: 'Escena lifestyle con contexto de uso', environment: { lighting: 'natural-golden-hour', background: 'contextual-environment', mood: 'warm-inviting' } },
  entities: [
    { id: 'subject_main', type: 'subject', name: 'Main Subject/Product', properties: { inContext: true, interaction: 'being-used' }, position: 'center', emphasis: 'primary' },
    { id: 'env_setting', type: 'environment', name: 'Setting', properties: { type: 'interior', style: 'modern-minimal', details: ['plants', 'natural-light', 'textures'] }, position: 'background', emphasis: 'secondary' },
    { id: 'props_supporting', type: 'props', name: 'Supporting Props', properties: { items: [], arrangement: 'natural-casual' }, position: 'surrounding', emphasis: 'background' },
  ],
  constraints: { technicalRequirements: { aspectRatio: '16:9', resolution: 'high', format: 'jpeg', colorGrading: 'warm-tones' } },
}

export const DIAGRAM_FLOWCHART_TEMPLATE: NanoBananaSchema = {
  meta: meta('diagram', 'technical-clean', 'diagram', 'Flowchart Diagram', 'Plantilla para diagramas de flujo'),
  scene: { id: 'scene_flowchart', description: 'Diagrama de flujo de proceso', environment: { lighting: 'flat', background: 'var(--color-bg-light)', mood: 'informative' } },
  entities: [
    { id: 'node_start', type: 'node', name: 'Start', properties: { shape: 'oval', backgroundColor: 'var(--color-success)', textColor: 'var(--color-bg-light)', text: 'Inicio', width: '120px', height: '60px' }, position: 'top', emphasis: 'primary' },
    { id: 'node_process_1', type: 'node', name: 'Process 1', properties: { shape: 'rectangle', backgroundColor: 'var(--color-info)', textColor: 'var(--color-bg-light)', text: 'Proceso', width: '160px', height: '80px' }, position: 'center', emphasis: 'primary' },
    { id: 'node_decision', type: 'node', name: 'Decision', properties: { shape: 'diamond', backgroundColor: 'var(--color-warning)', textColor: 'var(--color-bg-light)', text: 'Condicion?', width: '140px', height: '140px' }, position: 'center', emphasis: 'accent' },
    { id: 'node_end', type: 'node', name: 'End', properties: { shape: 'oval', backgroundColor: 'var(--color-error)', textColor: 'var(--color-bg-light)', text: 'Fin', width: '120px', height: '60px' }, position: 'bottom', emphasis: 'primary' },
    { id: 'connector_1', type: 'connector', name: 'Arrow 1', properties: { from: 'node_start', to: 'node_process_1', style: 'arrow', color: 'var(--color-gray-500)', strokeWidth: '2px' }, position: 'center', emphasis: 'secondary' },
  ],
  constraints: { technicalRequirements: { gridAlignment: true, vectorFormat: true, flowDirection: 'top-to-bottom' } },
}

export const DIAGRAM_ARCHITECTURE_TEMPLATE: NanoBananaSchema = {
  meta: meta('diagram', 'technical-detailed', 'diagram', 'Architecture Diagram', 'Plantilla para diagramas de arquitectura de sistemas'),
  scene: { id: 'scene_architecture', description: 'Diagrama de arquitectura de sistema', environment: { lighting: 'flat', background: 'var(--color-gray-50)', mood: 'technical' } },
  entities: [
    { id: 'layer_frontend', type: 'layer', name: 'Frontend Layer', properties: { backgroundColor: 'var(--color-legacy-dbeafe)', borderColor: 'var(--color-info)', label: 'Frontend' }, position: 'top', emphasis: 'primary', children: [{ id: 'comp_web_app', type: 'component', name: 'Web App', properties: { icon: 'browser', technology: 'React/Next.js' }, position: 'left', emphasis: 'primary' }, { id: 'comp_mobile_app', type: 'component', name: 'Mobile App', properties: { icon: 'smartphone', technology: 'React Native' }, position: 'right', emphasis: 'primary' }] },
    { id: 'layer_backend', type: 'layer', name: 'Backend Layer', properties: { backgroundColor: 'var(--color-legacy-dcfce7)', borderColor: 'var(--color-legacy-22c55e)', label: 'Backend' }, position: 'center', emphasis: 'primary', children: [{ id: 'comp_api', type: 'component', name: 'API Server', properties: { icon: 'server', technology: 'Node.js/Express' }, position: 'center', emphasis: 'primary' }] },
    { id: 'layer_data', type: 'layer', name: 'Data Layer', properties: { backgroundColor: 'var(--color-legacy-fef3c7)', borderColor: 'var(--color-warning)', label: 'Data' }, position: 'bottom', emphasis: 'primary', children: [{ id: 'comp_database', type: 'component', name: 'Database', properties: { icon: 'database', technology: 'PostgreSQL' }, position: 'left', emphasis: 'primary' }, { id: 'comp_cache', type: 'component', name: 'Cache', properties: { icon: 'zap', technology: 'Redis' }, position: 'right', emphasis: 'secondary' }] },
  ],
  constraints: { technicalRequirements: { gridAlignment: true, vectorFormat: true, layerSpacing: '40px' } },
}

export const TEMPLATES_BY_DOMAIN: Record<NanoBananaDomain, NanoBananaSchema[]> = {
  ui: [UI_MOBILE_APP_TEMPLATE, UI_DASHBOARD_TEMPLATE],
  photo: [PHOTO_PRODUCT_TEMPLATE, PHOTO_LIFESTYLE_TEMPLATE],
  diagram: [DIAGRAM_FLOWCHART_TEMPLATE, DIAGRAM_ARCHITECTURE_TEMPLATE],
}

export function getTemplate(domain: NanoBananaDomain, index: number = 0): NanoBananaSchema {
  const templates = TEMPLATES_BY_DOMAIN[domain]
  return templates[Math.min(index, templates.length - 1)]
}

export function cloneTemplate(template: NanoBananaSchema): NanoBananaSchema {
  const clone = JSON.parse(JSON.stringify(template)) as NanoBananaSchema
  clone.meta.createdAt = new Date().toISOString()
  clone.scene.id = `${clone.scene.id}_${Date.now()}`
  return clone
}
