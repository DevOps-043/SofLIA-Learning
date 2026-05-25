import {
  Chrome,
  Cloud,
  Globe,
  Linkedin,
  Link2,
  MessageSquare,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface IntegrationItem {
  name: string;
  icon: LucideIcon;
}

export const integrations: IntegrationItem[] = [
  { name: 'Slack', icon: MessageSquare },
  { name: 'Microsoft Teams', icon: Users },
  { name: 'Google Workspace', icon: Chrome },
  { name: 'Zoom', icon: Zap },
  { name: 'LinkedIn', icon: Linkedin },
  { name: 'API REST', icon: Link2 },
  { name: 'Webhooks', icon: Cloud },
  { name: 'SSO', icon: Globe },
];
