'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  showMoreText?: string;
  showLessText?: string;
}

// Función para formatear el texto preservando saltos de línea, listas y párrafos
function formatText(text: string): React.ReactNode {
  // Dividir el texto en líneas
  const lines = text.split('\n');
  const formattedElements: React.ReactNode[] = [];
  
  let currentList: string[] = [];
  let listType: 'ordered' | 'unordered' | null = null;
  
  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === 'ordered') {
        formattedElements.push(
          <ol key={`list-${formattedElements.length}`} className="list-decimal list-inside space-y-1 my-2 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-primary dark:text-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                {item.trim()}
              </li>
            ))}
          </ol>
        );
      } else if (listType === 'unordered') {
        formattedElements.push(
          <ul key={`list-${formattedElements.length}`} className="list-disc list-inside space-y-1 my-2 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-primary dark:text-white" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
                {item.trim()}
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Detectar listas numeradas (1., 2., etc.)
    const orderedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (orderedListMatch) {
      if (listType !== 'ordered') {
        flushList();
        listType = 'ordered';
      }
      currentList.push(orderedListMatch[2]);
      return;
    }
    
    // Detectar listas con viñetas (-, *, •)
    const unorderedListMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);
    if (unorderedListMatch) {
      if (listType !== 'unordered') {
        flushList();
        listType = 'unordered';
      }
      currentList.push(unorderedListMatch[1]);
      return;
    }
    
    // Si no es una lista, cerrar cualquier lista pendiente
    flushList();
    
    // Si la línea está vacía, agregar un espacio
    if (trimmedLine === '') {
      formattedElements.push(<br key={`br-${index}`} />);
      return;
    }
    
    // Detectar títulos/secciones (líneas que terminan con :)
    if (trimmedLine.endsWith(':')) {
      formattedElements.push(
        <p key={`p-${index}`} className="font-semibold text-primary dark:text-white mt-3 mb-1" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          {trimmedLine}
        </p>
      );
      return;
    }
    
    // Párrafo normal
    formattedElements.push(
      <p key={`p-${index}`} className="text-primary dark:text-white mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
        {trimmedLine}
      </p>
    );
  });
  
  // Cerrar cualquier lista pendiente al final
  flushList();
  
  return <div className="space-y-1">{formattedElements}</div>;
}

export function ExpandableText({
  text,
  maxLines = 2,
  className = '',
  showMoreText = 'Ver más',
  showLessText = 'Ver menos',
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Verificar si el texto necesita truncamiento
  // Usamos una aproximación: si el texto tiene más de ~150 caracteres, probablemente necesite truncamiento
  const needsTruncation = text.length > 150;

  if (!needsTruncation) {
    return (
      <div className={`text-primary dark:text-white leading-relaxed ${className}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
        {formatText(text)}
      </div>
    );
  }

  return (
    <div className={className}>
      {isExpanded ? (
        <div className="text-primary dark:text-white leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
          {formatText(text)}
        </div>
      ) : (
        <div
          className="text-primary dark:text-white leading-relaxed overflow-hidden"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {text}
        </div>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group relative mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out
          bg-accent/10 dark:bg-accent/20
          border border-accent/30 dark:border-accent/40
          text-accent dark:text-accent
          hover:bg-accent/20 dark:hover:bg-accent/30
          hover:border-accent/50 dark:hover:border-accent/60
          hover:shadow-md hover:shadow-accent/20 dark:hover:shadow-accent/30
          hover:scale-[1.02] active:scale-[0.98]
          backdrop-blur-sm overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
      >
        {/* Efecto de brillo sutil en hover */}
        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-500" />
        
        <span className="relative z-10 flex items-center gap-1.5">
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span>{showLessText}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              <span>{showMoreText}</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}
