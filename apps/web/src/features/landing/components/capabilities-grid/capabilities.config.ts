import {
  Award,
  BarChart3,
  Bot,
  Palette,
  Users2,
  type LucideIcon,
} from 'lucide-react';

export interface CapabilityItem {
  key: string;
  icon: LucideIcon;
  iconClassName: string;
}

export const capabilities: CapabilityItem[] = [
  { key: 'lia', icon: Bot, iconClassName: 'bg-accent/15 text-accent' },
  { key: 'analytics', icon: BarChart3, iconClassName: 'bg-warning/15 text-warning' },
  { key: 'teams', icon: Users2, iconClassName: 'bg-success/15 text-success' },
  { key: 'certificates', icon: Award, iconClassName: 'bg-violet-500/15 text-violet-500' },
  { key: 'whiteLabel', icon: Palette, iconClassName: 'bg-pink-500/15 text-pink-500' },
];
