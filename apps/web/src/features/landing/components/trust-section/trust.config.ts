import {
  Award,
  BarChart3,
  Globe2,
  Route,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface TrustBadge {
  icon: LucideIcon;
  key: string;
  iconClassName: string;
}

export interface TrustStat {
  key: string;
  value: string;
}

export const trustBadges: TrustBadge[] = [
  { icon: Globe2, key: 'multilingual', iconClassName: 'bg-accent/15 text-accent' },
  { icon: Route, key: 'learningPaths', iconClassName: 'bg-success/15 text-success' },
  { icon: Award, key: 'certificates', iconClassName: 'bg-warning/15 text-warning' },
  { icon: Users, key: 'roles', iconClassName: 'bg-primary/15 text-primary dark:text-white' },
  { icon: BarChart3, key: 'analytics', iconClassName: 'bg-accent/15 text-accent' },
  { icon: ShieldCheck, key: 'security', iconClassName: 'bg-success/15 text-success' },
];

export const trustStats: TrustStat[] = [
  { value: '3', key: 'languages' },
  { value: '24/7', key: 'lia' },
  { value: 'SHA-256', key: 'hash' },
];
