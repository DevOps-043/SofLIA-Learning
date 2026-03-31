import React from 'react';

function parseMarkdownContent(text: string, onLinkClick: (url: string) => void, isDarkMode: boolean = false): React.ReactNode {
  let keyIndex = 0;

  // Primero convertir listas con asterisco a guiones
  let processedText = text.replace(/^\*\s+/gm, '- ');

  // Dividir por líneas para procesar cada una
  const lines = processedText.split('\n');

  // Color del enlace basado en el tema
  const linkColor = isDarkMode ? '#00D4B3' : '#0A2540';

  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    // Regex combinado para encontrar negritas, cursivas y enlaces
    // Orden: enlaces primero, luego negritas, luego cursivas
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;

    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(line)) !== null) {
      // Texto antes del match
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // Es un enlace [texto](url)
        const linkText = match[2];
        const linkUrl = match[3];
        elements.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkUrl}
            onClick={(e) => {
              e.preventDefault();
              onLinkClick(linkUrl);
            }}
            style={{
              color: linkColor,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {linkText}
          </a>
        );
      } else if (match[4]) {
        // Es negrita **texto**
        elements.push(
          <strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>
            {match[5]}
          </strong>
        );
      } else if (match[6]) {
        // Es cursiva *texto*
        elements.push(
          <em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            {match[7]}
          </em>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Texto después del último match
    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex));
    }

    return elements.length > 0 ? elements : [line];
  };

  // Procesar cada línea y agregar saltos de línea
  const result: React.ReactNode[] = [];
  lines.forEach((line, index) => {
    result.push(...processInlineFormatting(line));
    if (index < lines.length - 1) {
      result.push(<br key={`br-${keyIndex++}`} />);
    }
  });

  return <>{result}</>;
}

export { parseMarkdownContent };
