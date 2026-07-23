import React from 'react';

import { normalizeLiaLinkUrl, type NormalizedLiaLink } from '../lia-link.utils';
import { parseTimecodeToSeconds } from './timecode';

// Núcleo de una marca de tiempo: `mm:ss` o `h:mm:ss`. Exige DOS dígitos tras cada
// `:` para no capturar ratios como "3:1"; y como usa `:` (no `/`), nunca colisiona
// con "24/7".
const TIMECODE_CORE = String.raw`\d{1,2}:\d{2}(?::\d{2})?`;

export function parseMarkdownContent(
  text: string,
  onLinkClick: (link: NormalizedLiaLink) => void,
  linkColor: string,
  onTimestampClick?: (seconds: number) => void,
): React.ReactNode {
  let keyIndex = 0;
  const lines = text.replace(/^\*\s+/gm, '- ').split('\n');

  const renderTimestamp = (timecode: string): React.ReactNode => {
    const seconds = parseTimecodeToSeconds(timecode);
    // Se muestra SIEMPRE con corchetes, venga como venga del modelo, para que se
    // lea como algo accionable ("[3:12]") y de forma uniforme.
    const label = `[${timecode}]`;

    if (!onTimestampClick || seconds === null) {
      // Sin reproductor al que saltar (p. ej. chat fuera de un curso) se muestra
      // como texto: no se finge una acción inexistente.
      return (
        <strong key={`ts-${keyIndex++}`} style={{ fontWeight: 600 }}>
          {label}
        </strong>
      );
    }

    return (
      <button
        key={`ts-${keyIndex++}`}
        type="button"
        onClick={() => onTimestampClick(seconds)}
        style={{
          background: 'transparent',
          border: 'none',
          color: linkColor,
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 600,
          padding: 0,
          textDecoration: 'underline',
        }}
        title="Ir a este momento del video"
      >
        {label}
      </button>
    );
  };

  const renderLink = (text: string, url: string): React.ReactNode => {
    const normalizedLink = normalizeLiaLinkUrl(url);
    if (!normalizedLink) return text;

    return (
      <a
        key={`link-${keyIndex++}`}
        href={normalizedLink.url}
        onClick={(event) => {
          event.preventDefault();
          onLinkClick(normalizedLink);
        }}
        rel={normalizedLink.kind === 'external' ? 'noopener noreferrer' : undefined}
        style={{ color: linkColor, textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
      >
        {text}
      </a>
    );
  };

  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    // El orden de las alternativas es la prioridad de coincidencia:
    //   1. enlace markdown `[texto](url)`
    //   2-4. marca de tiempo en sus TRES formas: negrita `**3:12**`, corchetes
    //        `[3:12]`, o suelta `3:12`. SofLIA no es consistente en cómo la
    //        formatea, así que se reconocen todas. Van ANTES que negrita/ruta para
    //        que un tiempo no se procese como negrita normal ni como enlace.
    //   5. URL o ruta interna. La ruta exige ≥2 caracteres tras la barra para que
    //      el `/7` de "24/7" no se pinte como enlace.
    //   6. negrita, 7. cursiva.
    const inlineRegex = new RegExp(
      [
        String.raw`(\[([^\]]+)\]\(([^)]+)\))`, // 1,2,3 link
        String.raw`\*\*\s*(${TIMECODE_CORE})\s*\*\*`, // 4 timestamp en negrita
        String.raw`\[\s*(${TIMECODE_CORE})\s*\]`, // 5 timestamp en corchetes
        String.raw`\b(${TIMECODE_CORE})\b`, // 6 timestamp suelto
        String.raw`((?:https?:\/\/|www\.)[^\s)]+|\/[A-Za-z0-9][A-Za-z0-9._~/-]+)`, // 7 url/ruta
        String.raw`(\*\*([^*]+)\*\*)`, // 8,9 negrita
        String.raw`(\*([^*\n]+)\*)`, // 10,11 cursiva
      ].join('|'),
      'g',
    );

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      const timecode = match[4] || match[5] || match[6];

      if (match[1]) {
        elements.push(renderLink(match[2], match[3]));
      } else if (timecode) {
        elements.push(renderTimestamp(timecode));
      } else if (match[7]) {
        elements.push(renderLink(match[7], match[7]));
      } else if (match[8]) {
        elements.push(
          <strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>
            {match[9]}
          </strong>,
        );
      } else if (match[10]) {
        elements.push(
          <em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            {match[11]}
          </em>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }

    return elements.length > 0 ? elements : [line];
  };

  const result: React.ReactNode[] = [];
  lines.forEach((line, index) => {
    result.push(...processInlineFormatting(line));
    if (index < lines.length - 1) {
      result.push(<br key={`br-${keyIndex++}`} />);
    }
  });

  return <>{result}</>;
}
