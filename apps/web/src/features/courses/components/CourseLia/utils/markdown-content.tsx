import React from 'react';

import { normalizeLiaLinkUrl, type NormalizedLiaLink } from '../lia-link.utils';

export function parseMarkdownContent(
  text: string,
  onLinkClick: (link: NormalizedLiaLink) => void,
  linkColor: string,
): React.ReactNode {
  let keyIndex = 0;
  const lines = text.replace(/^\*\s+/gm, '- ').split('\n');

  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|((?:https?:\/\/|www\.)[^\s)]+|\/[A-Za-z0-9][^\s)]*)|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = inlineRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index));
      }

      if (match[1] || match[4]) {
        const linkText = match[2] || match[4];
        const linkUrl = match[3] || match[4];
        const normalizedLink = normalizeLiaLinkUrl(linkUrl);

        elements.push(
          normalizedLink ? (
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
              {linkText}
            </a>
          ) : (
            linkText
          ),
        );
      } else if (match[5]) {
        elements.push(<strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>{match[6]}</strong>);
      } else if (match[7]) {
        elements.push(<em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>{match[8]}</em>);
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
