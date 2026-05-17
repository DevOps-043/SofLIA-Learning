import {
  Award,
  BarChart3,
  Bot,
  Calendar,
  FileCode,
  MessageSquare,
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
  { key: 'studyPlanner', icon: Calendar, iconClassName: 'bg-primary/15 text-primary' },
  { key: 'analytics', icon: BarChart3, iconClassName: 'bg-warning/15 text-warning' },
  { key: 'teams', icon: Users2, iconClassName: 'bg-success/15 text-success' },
  { key: 'certificates', icon: Award, iconClassName: 'bg-violet-500/15 text-violet-500' },
  { key: 'whiteLabel', icon: Palette, iconClassName: 'bg-pink-500/15 text-pink-500' },
  { key: 'scorm', icon: FileCode, iconClassName: 'bg-cyan-500/15 text-cyan-500' },
  { key: 'community', icon: MessageSquare, iconClassName: 'bg-teal-500/15 text-teal-500' },
];
