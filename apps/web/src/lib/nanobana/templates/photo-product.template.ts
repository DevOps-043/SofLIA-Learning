import type { NanoBananaSchema } from './types';

export const PHOTO_PRODUCT_TEMPLATE: NanoBananaSchema = {
  meta: {
    domain: 'photo', style: 'commercial-clean', outputFormat: 'render', version: '1.0',
    createdAt: new Date().toISOString(), title: 'Product Photography',
    description: 'Plantilla para fotografía de productos',
  },
  scene: {
    id: 'scene_product_photo', description: 'Fotografía de producto en estudio',
    environment: { lighting: 'studio-three-point', background: 'var(--color-bg-light)', mood: 'clean-professional' },
  },
  entities: [
    {
      id: 'product_main', type: 'product', name: 'Main Product', position: 'center', emphasis: 'primary',
      properties: { material: 'default', reflectivity: 0.3, shadow: { enabled: true, softness: 0.5, opacity: 0.3 } },
    },
    {
      id: 'light_key', type: 'light', name: 'Key Light', position: 'top-right', emphasis: 'background',
      properties: { type: 'softbox', intensity: 1.0, color: 'var(--color-bg-light)', angle: 45, distance: 'medium' },
    },
    {
      id: 'light_fill', type: 'light', name: 'Fill Light', position: 'left', emphasis: 'background',
      properties: { type: 'reflector', intensity: 0.5, color: 'var(--color-bg-light)', angle: -30 },
    },
    {
      id: 'light_rim', type: 'light', name: 'Rim Light', position: 'top-left', emphasis: 'background',
      properties: { type: 'strip', intensity: 0.7, color: 'var(--color-bg-light)', angle: 135 },
    },
  ],
  constraints: {
    technicalRequirements: { aspectRatio: '1:1', resolution: '2000x2000', format: 'png', colorSpace: 'sRGB' },
  },
};
