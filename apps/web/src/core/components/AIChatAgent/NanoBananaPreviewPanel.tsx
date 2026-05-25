'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NanoBananaFooter } from './NanoBananaPreviewPanel/NanoBananaFooter';
import { NanoBananaJsonView } from './NanoBananaPreviewPanel/NanoBananaJsonView';
import { NanoBananaPanelHeader } from './NanoBananaPreviewPanel/NanoBananaPanelHeader';
import { NanoBananaVisualSummary } from './NanoBananaPreviewPanel/NanoBananaVisualSummary';
import type {
  NanoBananaPreviewPanelProps,
  NanoBananaViewMode
} from './NanoBananaPreviewPanel/types';

export function NanoBananaPreviewPanel({
  schema,
  jsonString,
  domain,
  outputFormat,
  isOpen,
  onClose,
  onCopy,
  onDownload,
  onRegenerate,
  className = ''
}: NanoBananaPreviewPanelProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<NanoBananaViewMode>('visual');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      techDebtLogger.error('Error copying to clipboard:', error);
    }
  }, [jsonString, onCopy]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `nanobana-${domain}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onDownload?.();
  }, [jsonString, domain, onDownload]);

  if (!isOpen || !schema) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden ${className}`}
      >
        <NanoBananaPanelHeader
          domain={domain}
          outputFormat={outputFormat}
          viewMode={viewMode}
          onClose={onClose}
          onViewModeChange={setViewMode}
        />
        <div className="max-h-[400px] overflow-y-auto">
          {viewMode === 'visual' ? (
            <NanoBananaVisualSummary schema={schema} />
          ) : (
            <NanoBananaJsonView schema={schema} />
          )}
        </div>
        <NanoBananaFooter
          copied={copied}
          domain={domain}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onRegenerate={onRegenerate}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default NanoBananaPreviewPanel;
