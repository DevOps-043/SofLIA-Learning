'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ChevronDown, 
  ChevronRight,
  Smartphone,
  Camera,
  GitBranch,
  Palette,
  Code2,
  Eye,
  Edit3,
  RefreshCw
} from 'lucide-react';
import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../../lib/nanobana/templates';

interface NanoBananaPreviewPanelProps {
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

// Iconos por dominio
const DOMAIN_ICONS: Record<NanoBananaDomain, React.ReactNode> = {
  ui: <Smartphone className="w-4 h-4" />,
  photo: <Camera className="w-4 h-4" />,
  diagram: <GitBranch className="w-4 h-4" />
};

// Nombres amigables
const DOMAIN_NAMES: Record<NanoBananaDomain, string> = {
  ui: 'UI/Wireframe',
  photo: 'Fotografía',
  diagram: 'Diagrama'
};

const FORMAT_NAMES: Record<OutputFormat, string> = {
  wireframe: 'Wireframe',
  mockup: 'Mockup',
  render: 'Render',
  diagram: 'Diagrama'
};

// Colores por dominio
const DOMAIN_COLORS: Record<NanoBananaDomain, string> = {
  ui: 'from-blue-500 to-cyan-500',
  photo: 'from-amber-500 to-orange-500',
  diagram: 'from-purple-500 to-pink-500'
};

// Componente para sección colapsable del JSON
const JsonSection: React.FC<{
  title: string;
  data: unknown;
  defaultExpanded?: boolean;
  level?: number;
}> = ({ title, data, defaultExpanded = false, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const formattedData = useMemo(() => {
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  }, [data]);

  const isObject = typeof data === 'object' && data !== null;
  const itemCount = isObject ? (Array.isArray(data) ? data.length : Object.keys(data).length) : 0;

  return (
    <div className={`border-l-2 border-white/10 ${level > 0 ? 'ml-3' : ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        {isObject ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )
        ) : (
          <div className="w-4" />
        )}
        <span className="text-cyan-400 font-mono text-sm">{title}</span>
        {isObject && (
          <span className="text-gray-500 text-xs">
            {Array.isArray(data) ? `[${itemCount}]` : `{${itemCount}}`}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && isObject && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="px-4 py-2 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {formattedData}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const NanoBananaPreviewPanel: React.FC<NanoBananaPreviewPanelProps> = ({
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
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  if (!isOpen || !schema) {
    return null;
  }

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }, [jsonString, onCopy]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nanobana-${domain}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onDownload?.();
  }, [jsonString, domain, onDownload]);

  const entityCount = schema.entities?.length || 0;
  const hasVariations = (schema.variations?.length || 0) > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`
          bg-gradient-to-br from-gray-900/95 to-gray-800/95
          backdrop-blur-xl
          border border-white/10
          rounded-2xl
          shadow-2xl
          overflow-hidden
          ${className}
        `}
      >
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${DOMAIN_COLORS[domain]} p-[1px]`}>
          <div className="bg-gray-900/95 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${DOMAIN_COLORS[domain]}`}>
                  {DOMAIN_ICONS[domain]}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    NanoBanana JSON
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {DOMAIN_NAMES[domain]} • {FORMAT_NAMES[outputFormat]}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Toggle vista */}
                <div className="flex bg-gray-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      viewMode === 'visual' 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      viewMode === 'json' 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-h-[400px] overflow-y-auto">
          {viewMode === 'visual' ? (
            // Vista Visual
            <div className="p-4 space-y-4">
              {/* Stats rápidas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{entityCount}</div>
                  <div className="text-xs text-gray-400">Entidades</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">
                    {schema.variations?.length || 0}
                  </div>
                  <div className="text-xs text-gray-400">Variaciones</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Palette className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-xs text-gray-400">
                    {schema.scene.environment.colorScheme || 'custom'}
                  </div>
                </div>
              </div>

              {/* Descripción de la escena */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-medium text-white mb-2">Escena</h4>
                <p className="text-sm text-gray-300">{schema.scene.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                    {schema.scene.environment.lighting}
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                    {schema.scene.environment.mood}
                  </span>
                </div>
              </div>

              {/* Lista de entidades */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-sm font-medium text-white mb-3">
                  Entidades ({entityCount})
                </h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {schema.entities.map((entity, idx) => (
                    <div 
                      key={entity.id}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-cyan-400">
                          {entity.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2 py-0.5 rounded text-xs
                          ${entity.emphasis === 'primary' ? 'bg-blue-500/20 text-blue-300' : ''}
                          ${entity.emphasis === 'secondary' ? 'bg-gray-500/20 text-gray-300' : ''}
                          ${entity.emphasis === 'accent' ? 'bg-amber-500/20 text-amber-300' : ''}
                          ${entity.emphasis === 'background' ? 'bg-gray-700/20 text-gray-400' : ''}
                        `}>
                          {entity.emphasis}
                        </span>
                        <span className="text-xs text-gray-500">{entity.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constraints */}
              {schema.constraints.accessibility && (
                <div className="bg-white/5 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white mb-2">
                    Accesibilidad
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {schema.constraints.accessibility.minTouchTarget && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                        Touch: {schema.constraints.accessibility.minTouchTarget}
                      </span>
                    )}
                    {schema.constraints.accessibility.contrastRatio && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                        Contraste: {schema.constraints.accessibility.contrastRatio}
                      </span>
                    )}
                    {schema.constraints.accessibility.colorBlindSafe && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                        ✓ Daltonismo
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Vista JSON
            <div className="p-2">
              <JsonSection title="meta" data={schema.meta} defaultExpanded />
              <JsonSection title="scene" data={schema.scene} defaultExpanded />
              <JsonSection title="entities" data={schema.entities} />
              <JsonSection title="constraints" data={schema.constraints} />
              {hasVariations && (
                <JsonSection title="variations" data={schema.variations} />
              )}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                rounded-xl font-medium text-sm transition-all
                ${copied 
                  ? 'bg-green-500 text-white' 
                  : `bg-gradient-to-r ${DOMAIN_COLORS[domain]} text-white hover:opacity-90`
                }
              `}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar JSON
                </>
              )}
            </button>
            
            <button
              onClick={handleDownload}
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
          
          {/* Nota sobre uso */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            Copia este JSON y pégalo en NanoBanana Pro para renderizar
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NanoBananaPreviewPanel;
