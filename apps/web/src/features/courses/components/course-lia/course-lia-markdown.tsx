import type { ReactNode } from 'react';

function parseInlineFormatting(
  line: string,
  linkColor: string,
  onLinkClick: (url: string) => void,
  nextKey: () => number,
): ReactNode[] {
  const elements: ReactNode[] = [];
  const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      elements.push(line.slice(lastIndex, match.index));
    }

    if (match[1]) {
      const linkText = match[2];
      const linkUrl = match[3];
      elements.push(
        <a
          key={`link-${nextKey()}`}
          href={linkUrl}
          onClick={(event) => {
            event.preventDefault();
            onLinkClick(linkUrl);
          }}
          style={{ color: linkColor, textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}
        >
          {linkText}
        </a>,
      );
    } else if (match[4]) {
      elements.push(
        <strong key={`bold-${nextKey()}`} style={{ fontWeight: 600 }}>
          {match[5]}
        </strong>,
      );
    } else if (match[6]) {
      elements.push(
        <em key={`italic-${nextKey()}`} style={{ fontStyle: 'italic' }}>
          {match[7]}
        </em>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    elements.push(line.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [line];
}

export function parseMarkdownContent(
  text: string,
  onLinkClick: (url: string) => void,
  isDarkMode = true,
): ReactNode {
  let keyIndex = 0;
  const nextKey = () => keyIndex++;
  const linkColor = isDarkMode ? '#00D4B3' : '#0A2540';
  const lines = text.replace(/^\*\s+/gm, '- ').split('\n');
  const result: ReactNode[] = [];

  lines.forEach((line, index) => {
    result.push(...parseInlineFormatting(line, linkColor, onLinkClick, nextKey));
    if (index < lines.length - 1) {
      result.push(<br key={`br-${nextKey()}`} />);
    }
  });

  return <>{result}</>;
}
