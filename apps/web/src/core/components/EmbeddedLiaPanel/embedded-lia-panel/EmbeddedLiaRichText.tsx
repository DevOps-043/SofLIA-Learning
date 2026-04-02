'use client';

import { tokenizeEmbeddedLiaText } from './service';

interface EmbeddedLiaRichTextProps {
  text: string;
  onNavigate: (href: string) => void;
}

export function EmbeddedLiaRichText({ text, onNavigate }: EmbeddedLiaRichTextProps) {
  return (
    <>
      {tokenizeEmbeddedLiaText(text).map((token, index) => {
        if (token.type === 'text') {
          return <span key={`text-${index}`}>{token.content}</span>;
        }

        const isRelative = token.href?.startsWith('/');
        return (
          <a
            key={`link-${index}`}
            href={token.href}
            onClick={(event) => {
              if (isRelative && token.href) {
                event.preventDefault();
                onNavigate(token.href);
              }
            }}
            className="text-[#00D4B3] dark:text-[#00D4B3] hover:text-[#00b89a] dark:hover:text-[#00b89a] underline font-medium transition-colors"
            {...(!isRelative && { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {token.content}
          </a>
        );
      })}
    </>
  );
}
