import {
  Eye,
  FileSearch,
  Lock,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface SecurityFeature {
  key: string;
  icon: LucideIcon;
  iconClassName: string;
}

export const securityFeatures: SecurityFeature[] = [
  { key: 'roles', icon: Users, iconClassName: 'bg-accent/15 text-accent' },
  { key: 'hierarchy', icon: Settings, iconClassName: 'bg-violet-500/15 text-violet-500' },
  { key: 'audit', icon: FileSearch, iconClassName: 'bg-warning/15 text-warning' },
  { key: 'visibility', icon: Eye, iconClassName: 'bg-success/15 text-success' },
  { key: 'encryption', icon: Lock, iconClassName: 'bg-pink-500/15 text-pink-500' },
  { key: 'sso', icon: Shield, iconClassName: 'bg-primary/15 text-primary dark:text-white' },
];
