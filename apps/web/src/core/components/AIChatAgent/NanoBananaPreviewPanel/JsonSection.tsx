'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface JsonSectionProps {
  title: string;
  data: unknown;
  defaultExpanded?: boolean;
  level?: number;
}

export function JsonSection({
  title,
  data,
  defaultExpanded = false,
  level = 0
}: JsonSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const formattedData = useMemo(() => formatJsonValue(data), [data]);
  const isObject = typeof data === 'object' && data !== null;
  const itemCount = getJsonItemCount(data);

  return (
    <div className={`border-l-2 border-white/10 ${level > 0 ? 'ml-3' : ''}`}>
      <button
        onClick={() => setIsExpanded((current) => !current)}
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
        {isObject && <JsonItemCount isArray={Array.isArray(data)} count={itemCount} />}
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
}

function JsonItemCount({ isArray, count }: { isArray: boolean; count: number }) {
  return (
    <span className="text-gray-500 text-xs">
      {isArray ? `[${count}]` : `{${count}}`}
    </span>
  );
}

function formatJsonValue(data: unknown) {
  return typeof data === 'object' && data !== null
    ? JSON.stringify(data, null, 2)
    : String(data);
}

function getJsonItemCount(data: unknown) {
  if (typeof data !== 'object' || data === null) {
    return 0;
  }

  return Array.isArray(data) ? data.length : Object.keys(data).length;
}
