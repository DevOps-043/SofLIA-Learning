import type { TFunction } from 'i18next';
import { FileText, Shield, Users, type LucideIcon } from 'lucide-react';
import type { LegalDocumentTab } from '../../types/auth.types';

export interface LegalDocumentSection {
  number: number;
  title: string;
  content: string;
  list?: string[];
}

export interface LegalDocument {
  title: string;
  summary?: string;
  sections: LegalDocumentSection[];
}

export interface LegalDocumentTabConfig {
  id: LegalDocumentTab;
  icon: LucideIcon;
  labelKey: string;
}

export const LEGAL_DOCUMENT_TABS: LegalDocumentTabConfig[] = [
  { id: 'terms', labelKey: 'tabs.terms', icon: FileText },
  { id: 'privacy', labelKey: 'tabs.privacy', icon: Shield },
  { id: 'conduct', labelKey: 'tabs.conduct', icon: Users },
];

export function getLegalDocument(t: TFunction<'legal'>, tab: LegalDocumentTab): LegalDocument {
  return t(`documents.${tab}`, { returnObjects: true }) as LegalDocument;
}
