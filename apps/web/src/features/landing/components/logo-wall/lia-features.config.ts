import {
  Brain,
  MessageSquare,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface LiaFeature {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

export const liaFeatures: LiaFeature[] = [
  { icon: MessageSquare, titleKey: 'chat', descKey: 'chatDesc' },
  { icon: Brain, titleKey: 'adaptive', descKey: 'adaptiveDesc' },
  { icon: Target, titleKey: 'personalized', descKey: 'personalizedDesc' },
  { icon: Zap, titleKey: 'instant', descKey: 'instantDesc' },
];
