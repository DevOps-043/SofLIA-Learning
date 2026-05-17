import { Award, BarChart3, Clock, DollarSign, type LucideIcon } from 'lucide-react';

export interface RoiMetric {
  key: string;
  value: number;
  icon: LucideIcon;
  valueClassName: string;
  iconClassName: string;
  trend: 'down' | 'up';
  prefix?: string;
  suffix?: string;
}

export const roiMetrics: RoiMetric[] = [
  {
    key: 'onboarding',
    value: 60,
    suffix: '%',
    icon: Clock,
    valueClassName: 'text-accent',
    iconClassName: 'bg-accent/20 text-accent',
    trend: 'down',
  },
  {
    key: 'savings',
    value: 150,
    prefix: '$',
    suffix: 'K',
    icon: DollarSign,
    valueClassName: 'text-success',
    iconClassName: 'bg-success/20 text-success',
    trend: 'up',
  },
  {
    key: 'completion',
    value: 85,
    suffix: '%',
    icon: Award,
    valueClassName: 'text-violet-400',
    iconClassName: 'bg-violet-500/20 text-violet-300',
    trend: 'up',
  },
  {
    key: 'productivity',
    value: 40,
    suffix: '%',
    icon: BarChart3,
    valueClassName: 'text-warning',
    iconClassName: 'bg-warning/20 text-warning',
    trend: 'up',
  },
];
