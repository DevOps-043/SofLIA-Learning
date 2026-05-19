import type { Emphasis, NanoBananaEntity, NanoBananaSchema } from './types';

function component(
  id: string,
  name: string,
  icon: string,
  technology: string,
  position: NanoBananaEntity['position'],
  emphasis: Emphasis = 'primary',
): NanoBananaEntity {
  return { id, type: 'component', name, position, emphasis, properties: { icon, technology } };
}

function layer(input: {
  id: string; name: string; label: string; backgroundColor: string; borderColor: string;
  position: NanoBananaEntity['position']; children: NanoBananaEntity[];
}): NanoBananaEntity {
  return {
    id: input.id, type: 'layer', name: input.name, position: input.position, emphasis: 'primary',
    properties: { backgroundColor: input.backgroundColor, borderColor: input.borderColor, label: input.label },
    children: input.children,
  };
}

export const DIAGRAM_ARCHITECTURE_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'diagram', style: 'technical-detailed', outputFormat: 'diagram', version: '1.0',
    createdAt: new Date().toISOString(), title: 'Architecture Diagram',
    description: 'Plantilla para diagramas de arquitectura de sistemas',
  },
  scene: {
    id: 'scene_architecture', description: 'Diagrama de arquitectura de sistema',
    environment: { lighting: 'flat', background: 'var(--color-gray-50)', mood: 'technical' },
  },
  entities: [
    layer({
      id: 'layer_frontend', name: 'Frontend Layer', label: 'Frontend', backgroundColor: 'var(--color-legacy-dbeafe)',
      borderColor: 'var(--color-info)', position: 'top',
      children: [
        component('comp_web_app', 'Web App', 'browser', 'React/Next.js', 'left'),
        component('comp_mobile_app', 'Mobile App', 'smartphone', 'React Native', 'right'),
      ],
    }),
    layer({
      id: 'layer_backend', name: 'Backend Layer', label: 'Backend', backgroundColor: 'var(--color-legacy-dcfce7)',
      borderColor: 'var(--color-legacy-22c55e)', position: 'center',
      children: [component('comp_api', 'API Server', 'server', 'Node.js/Express', 'center')],
    }),
    layer({
      id: 'layer_data', name: 'Data Layer', label: 'Data', backgroundColor: 'var(--color-legacy-fef3c7)',
      borderColor: 'var(--color-warning)', position: 'bottom',
      children: [
        component('comp_database', 'Database', 'database', 'PostgreSQL', 'left'),
        component('comp_cache', 'Cache', 'zap', 'Redis', 'right', 'secondary'),
      ],
    }),
  ],
  constraints: { technicalRequirements: { gridAlignment: true, vectorFormat: true, layerSpacing: '40px' } },
};
