import type { NanoBananaSchema } from './types';

const nodeDefaults = { type: 'node', emphasis: 'primary' } as const;

export const DIAGRAM_FLOWCHART_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'diagram', style: 'technical-clean', outputFormat: 'diagram', version: '1.0',
    createdAt: new Date().toISOString(), title: 'Flowchart Diagram',
    description: 'Plantilla para diagramas de flujo',
  },
  scene: {
    id: 'scene_flowchart', description: 'Diagrama de flujo de proceso',
    environment: { lighting: 'flat', background: '#FFFFFF', mood: 'informative' },
  },
  entities: [
    {
      ...nodeDefaults, id: 'node_start', name: 'Start', position: 'top',
      properties: { shape: 'oval', backgroundColor: '#10B981', textColor: '#FFFFFF', text: 'Inicio', width: '120px', height: '60px' },
    },
    {
      ...nodeDefaults, id: 'node_process_1', name: 'Process 1', position: 'center',
      properties: { shape: 'rectangle', backgroundColor: '#3B82F6', textColor: '#FFFFFF', text: 'Proceso', width: '160px', height: '80px' },
    },
    {
      ...nodeDefaults, id: 'node_decision', name: 'Decision', position: 'center', emphasis: 'accent',
      properties: { shape: 'diamond', backgroundColor: '#F59E0B', textColor: '#FFFFFF', text: '¿Condición?', width: '140px', height: '140px' },
    },
    {
      ...nodeDefaults, id: 'node_end', name: 'End', position: 'bottom',
      properties: { shape: 'oval', backgroundColor: '#EF4444', textColor: '#FFFFFF', text: 'Fin', width: '120px', height: '60px' },
    },
    {
      id: 'connector_1', type: 'connector', name: 'Arrow 1', position: 'center', emphasis: 'secondary',
      properties: { from: 'node_start', to: 'node_process_1', style: 'arrow', color: '#64748B', strokeWidth: '2px' },
    },
  ],
  constraints: { technicalRequirements: { gridAlignment: true, vectorFormat: true, flowDirection: 'top-to-bottom' } },
};
