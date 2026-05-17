import type React from 'react';
import { Camera, GitBranch, Smartphone } from 'lucide-react';
import type {
  NanoBananaDomain,
  OutputFormat
} from '../../../../lib/nanobana/templates';

export const DOMAIN_ICONS: Record<NanoBananaDomain, React.ReactNode> = {
  ui: <Smartphone className="w-4 h-4" />,
  photo: <Camera className="w-4 h-4" />,
  diagram: <GitBranch className="w-4 h-4" />
};

export const DOMAIN_NAMES: Record<NanoBananaDomain, string> = {
  ui: 'UI/Wireframe',
  photo: 'Fotografia',
  diagram: 'Diagrama'
};

export const FORMAT_NAMES: Record<OutputFormat, string> = {
  wireframe: 'Wireframe',
  mockup: 'Mockup',
  render: 'Render',
  diagram: 'Diagrama'
};

export const DOMAIN_COLORS: Record<NanoBananaDomain, string> = {
  ui: 'from-blue-500 to-cyan-500',
  photo: 'from-amber-500 to-orange-500',
  diagram: 'from-purple-500 to-pink-500'
};
