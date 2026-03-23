import React from 'react';
import Image from 'next/image';
import { BookOpen, Zap, Scale, Clock } from 'lucide-react';

interface SofLIAMessageFormatterProps {
  text: string;
}

export const SofLIAMessageFormatter: React.FC<SofLIAMessageFormatterProps> = ({ text }) => {
  if (!text) return null;

  // Limpiar TODOS los emojis usando regex Unicode
  let cleaned = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

  // Limpiar emojis específicos adicionales que podrían haber quedado
  cleaned = cleaned
    .replace(/[ðŸŽ¯â °â Œâš ï¸ ðŸŽ‰â­ ðŸŽ“ðŸ“ ðŸŽ¯ðŸ †ðŸŽ¨âš¡ðŸŽ âŒ¨ï¸ ]/g, '')
    .trim();


  // Limpiar bullets mal codificados (â€¢) y convertirlos a guiones
  cleaned = cleaned.replace(/â€¢/g, '-');

  // Dividir en líneas
  const lines = cleaned.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  // Función para agregar línea separadora
  const addSeparator = () => {
    elements.push(
      <div key={`separator-${elements.length}`} className="my-6 flex items-center justify-center">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-500/40 to-transparent"></div>
        <div className="mx-4 w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-500/40"></div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-500/40 to-transparent"></div>
      </div>
    );
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const paraText = currentParagraph.join('\n').trim();
      if (paraText) {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-4 font-body text-[15px] leading-[1.75] text-gray-800 dark:text-slate-50 tracking-wide dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3)] whitespace-pre-line">
            {formatInlineStyles(paraText)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-3 my-5 ml-1 pl-4 border-l-2 border-purple-500/30 dark:border-purple-500/20">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInlineStyles = (text: string): React.ReactNode => {
    // Formatear negritas **texto**
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`} className="font-body text-gray-800 dark:text-slate-50 dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      parts.push(
        <strong
          key={`bold-${key++}`}
          className="font-body font-semibold text-gray-900 dark:text-white tracking-tight dark:[text-shadow:0_2px_6px_rgba(0,0,0,0.6),0_0_10px_rgba(168,85,247,0.3)] relative"
        >
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${key++}`} className="font-body text-gray-800 dark:text-slate-50 dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? <>{parts}</> : <span className="font-body text-gray-800 dark:text-slate-50 dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">{text}</span>;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Detectar líneas separadoras manuales (guiones, iguales, etc.)
    if (trimmed.match(/^[-=]{3,}$/)) {
      flushList();
      flushParagraph();
      addSeparator();
      return;
    }

    // Detectar títulos de sección principales
    if (trimmed.match(/^(MIS RECOMENDACIONES|METAS SEMANALES|HE REVISADO TU PERFIL):/i)) {
      flushList();
      flushParagraph();
      // Agregar línea separadora antes del título importante
      if (elements.length > 0) {
        addSeparator();
      }
      const title = trimmed.replace(/^[ðŸŽ¯????????ï¸ â °???â Œâš ï¸ ]*\s*/, '').replace(/\*\*/g, '').replace(/:/g, '').trim();
      let titleClass = 'font-heading font-bold text-[22px] sm:text-[24px] bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 dark:from-purple-400 dark:via-purple-300 dark:to-purple-400 bg-clip-text text-transparent mt-10 mb-6 pb-3 border-b-2 border-purple-500/30 dark:border-purple-500/40 tracking-tight';
      if (trimmed.includes('METAS SEMANALES')) {
        titleClass = 'font-heading font-bold text-[22px] sm:text-[24px] bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#0A2540] dark:from-[#0A2540] dark:via-[#0A2540] dark:to-[#0A2540] bg-clip-text text-transparent mt-10 mb-6 pb-3 border-b-2 border-[#0A2540]/40 tracking-tight'; /* Azul Profundo */
      } else if (trimmed.includes('HE REVISADO TU PERFIL')) {
        titleClass = 'font-heading font-bold text-[20px] sm:text-[22px] bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 dark:from-purple-400 dark:via-purple-300 dark:to-purple-400 bg-clip-text text-transparent mt-10 mb-6 pb-3 border-b-2 border-purple-500/30 dark:border-purple-500/40 tracking-tight';
      }
      elements.push(
        <h2 key={`h2-${index}`} className={`${titleClass} dark:[text-shadow:0_2px_8px_rgba(0,0,0,0.4)]`}>
          {title}
        </h2>
      );
      return;
    }

    // Detectar subtítulos de sección
    if (trimmed.match(/^(Por curso|Esta semana aprenderás sobre|ESTIMACIÓN BASADA EN TU PERFIL):/i)) {
      flushList();
      flushParagraph();
      const subtitle = trimmed.replace(/^[ðŸŽ¯????????ï¸ â °???â Œâš ï¸ ]*\s*/, '').replace(/\*\*/g, '').replace(/:/g, '').trim();
      let subtitleClass = 'font-body font-semibold text-[17px] text-purple-600 dark:text-purple-200 mt-8 mb-5 tracking-wide';
      if (trimmed.includes('Esta semana aprenderás')) {
        subtitleClass = 'font-body font-semibold text-[17px] text-blue-600 dark:text-blue-200 mt-8 mb-5 tracking-wide';
      } else if (trimmed.includes('ESTIMACIÓN BASADA')) {
        subtitleClass = 'font-body font-semibold text-[15px] text-blue-500 dark:text-blue-300 mt-7 mb-4 tracking-wide';
      }
      elements.push(
        <h3 key={`h3-${index}`} className={`${subtitleClass} dark:[text-shadow:0_1px_4px_rgba(0,0,0,0.4)]`}>
          {subtitle}
        </h3>
      );
      return;
    }

    // Detectar encabezados de día del calendario (ej: "**Martes 9 de febrero:**" o "Martes 9 de febrero:")
    const dayHeaderMatch = trimmed.match(/^\*{0,2}(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d{1,2}\s+de\s+\w+:?\*{0,2}:?$/i);
    if (dayHeaderMatch) {
      flushList();
      flushParagraph();
      const dayText = trimmed.replace(/\*+/g, '').replace(/:$/, '').trim();
      elements.push(
        <div key={`day-${index}`} className="mt-6 mb-2 flex items-center gap-2">
          <span className="text-lg">??</span>
          <h4 className="font-heading font-bold text-[16px] sm:text-[17px] text-[#0A2540] dark:text-[#00D4B3] tracking-tight dark:[text-shadow:0_1px_4px_rgba(0,212,179,0.3)]">
            {dayText}
          </h4>
        </div>
      );
      return;
    }

    // Detectar línea de HORARIO EXACTO (ej: "HORARIO EXACTO: 18:00 - 21:57 (237 min):")
    if (trimmed.match(/^HORARIO EXACTO:/i)) {
      flushList();
      flushParagraph();
      elements.push(
        <p key={`schedule-${index}`} className="mt-2 mb-1 ml-2 font-body font-semibold text-[14px] text-gray-600 dark:text-gray-300 tracking-wide dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
          ? {trimmed}
        </p>
      );
      return;
    }

    // Detectar notas
    if (trimmed.match(/^Nota:/i)) {
      flushList();
      flushParagraph();
      const noteText = trimmed.replace(/^Nota:\s*/i, '').trim();
      elements.push(
        <div key={`note-${index}`} className="mt-5 mb-4 p-4 bg-yellow-500/10 border-l-4 border-yellow-500/60 rounded-r-xl backdrop-blur-sm shadow-lg shadow-yellow-500/5">
          <p className="font-body font-semibold text-[14px] text-yellow-700 dark:text-yellow-300 mb-2 tracking-wide dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.4)]">Nota:</p>
          <p className="font-body text-[14px] text-yellow-800/90 dark:text-yellow-200/90 leading-[1.7] tracking-wide dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">{formatInlineStyles(noteText)}</p>
        </div>
      );
      return;
    }

    // Detectar listas (guiones, bullets, etc.) - NO confundir **bold** con lista
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || (trimmed.startsWith('*') && !trimmed.startsWith('**'))) {
      flushParagraph();
      if (!inList) {
        inList = true;
      }
      const itemText = trimmed.replace(/^[-•*]\s*/, '').trim();
      if (itemText) {
        listItems.push(
          <li key={`li-${index}`} className="flex items-start gap-3.5 font-body text-[15px] text-gray-800 dark:text-slate-50 leading-[1.75] tracking-wide dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">
            <span className="text-purple-600 dark:text-purple-300 font-bold mt-0.5 flex-shrink-0 text-lg dark:[text-shadow:0_1px_3px_rgba(168,85,247,0.5)]">•</span>
            <span className="flex-1">{formatInlineStyles(itemText)}</span>
          </li>
        );
      }
      return;
    }

    // Fin de lista
    if (inList && trimmed === '') {
      flushList();
      return;
    }

    if (inList) {
      flushList();
    }

    // Si estamos en una lista y llega texto que no es lista, cerrar la lista anterior
    if (inList && trimmed) {
      flushList();
    }

    // Agregar a párrafo
    if (trimmed) {
      currentParagraph.push(trimmed);
    } else if (currentParagraph.length > 0) {
      flushParagraph();
    }
  });

  flushList();
  flushParagraph();

  return <div className="space-y-0 text-inherit">{elements}</div>;
};
