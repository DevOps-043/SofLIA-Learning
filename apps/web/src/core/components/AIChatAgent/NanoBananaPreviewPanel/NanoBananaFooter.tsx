import { Check, Copy, Download, RefreshCw } from 'lucide-react';
import { DOMAIN_COLORS } from './preview-panel.constants';
import type { NanoBananaFooterProps } from './types';

export function NanoBananaFooter({
  copied,
  domain,
  onCopy,
  onDownload,
  onRegenerate
}: NanoBananaFooterProps) {
  return (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onCopy}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : `bg-gradient-to-r ${DOMAIN_COLORS[domain]} text-white hover:opacity-90`
          }`}
        >
          {copied ? <CopiedState /> : <CopyState />}
        </button>

        <button
          onClick={onDownload}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          title="Descargar JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            title="Regenerar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Copia este JSON y pegalo en NanoBanana Pro para renderizar
      </p>
    </div>
  );
}

function CopiedState() {
  return (
    <>
      <Check className="w-4 h-4" />
      Copiado
    </>
  );
}

function CopyState() {
  return (
    <>
      <Copy className="w-4 h-4" />
      Copiar JSON
    </>
  );
}
