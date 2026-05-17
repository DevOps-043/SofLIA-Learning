import type {
  NanoBananaDomain,
  NanoBananaSchema,
  OutputFormat
} from '../../../../lib/nanobana/templates';

export interface NanoBananaPreviewPanelProps {
  schema: NanoBananaSchema | null;
  jsonString: string;
  domain: NanoBananaDomain;
  outputFormat: OutputFormat;
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDownload?: () => void;
  onRegenerate?: () => void;
  className?: string;
}

export interface NanoBananaPanelHeaderProps {
  domain: NanoBananaDomain;
  outputFormat: OutputFormat;
  viewMode: NanoBananaViewMode;
  onClose: () => void;
  onViewModeChange: (viewMode: NanoBananaViewMode) => void;
}

export interface NanoBananaFooterProps {
  copied: boolean;
  domain: NanoBananaDomain;
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate?: () => void;
}

export type NanoBananaViewMode = 'visual' | 'json';
