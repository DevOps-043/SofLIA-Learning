import type { NanoBananaSchema } from './types';

export const PHOTO_LIFESTYLE_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'photo', style: 'lifestyle-aspirational', outputFormat: 'render', version: '1.0',
    createdAt: new Date().toISOString(), title: 'Lifestyle Photography',
    description: 'Plantilla para fotografía lifestyle/marketing',
  },
  scene: {
    id: 'scene_lifestyle', description: 'Escena lifestyle con contexto de uso',
    environment: { lighting: 'natural-golden-hour', background: 'contextual-environment', mood: 'warm-inviting' },
  },
  entities: [
    {
      id: 'subject_main', type: 'subject', name: 'Main Subject/Product', position: 'center', emphasis: 'primary',
      properties: { inContext: true, interaction: 'being-used' },
    },
    {
      id: 'env_setting', type: 'environment', name: 'Setting', position: 'background', emphasis: 'secondary',
      properties: { type: 'interior', style: 'modern-minimal', details: ['plants', 'natural-light', 'textures'] },
    },
    {
      id: 'props_supporting', type: 'props', name: 'Supporting Props', position: 'surrounding', emphasis: 'background',
      properties: { items: [], arrangement: 'natural-casual' },
    },
  ],
  constraints: {
    technicalRequirements: { aspectRatio: '16:9', resolution: 'high', format: 'jpeg', colorGrading: 'warm-tones' },
  },
};
