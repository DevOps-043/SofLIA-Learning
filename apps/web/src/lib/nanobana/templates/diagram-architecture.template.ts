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
    environment: { lighting: 'flat', background: '#F8FAFC', mood: 'technical' },
  },
  entities: [
    layer({
      id: 'layer_frontend', name: 'Frontend Layer', label: 'Frontend', backgroundColor: '#DBEAFE',
      borderColor: '#3B82F6', position: 'top',
      children: [
        component('comp_web_app', 'Web App', 'browser', 'React/Next.js', 'left'),
        component('comp_mobile_app', 'Mobile App', 'smartphone', 'React Native', 'right'),
      ],
    }),
    layer({
      id: 'layer_backend', name: 'Backend Layer', label: 'Backend', backgroundColor: '#DCFCE7',
      borderColor: '#22C55E', position: 'center',
      children: [component('comp_api', 'API Server', 'server', 'Node.js/Express', 'center')],
    }),
    layer({
      id: 'layer_data', name: 'Data Layer', label: 'Data', backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B', position: 'bottom',
      children: [
        component('comp_database', 'Database', 'database', 'PostgreSQL', 'left'),
        component('comp_cache', 'Cache', 'zap', 'Redis', 'right', 'secondary'),
      ],
    }),
  ],
  constraints: { technicalRequirements: { gridAlignment: true, vectorFormat: true, layerSpacing: '40px' } },
};
