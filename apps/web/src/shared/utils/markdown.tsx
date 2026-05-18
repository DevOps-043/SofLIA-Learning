import React from 'react'

const SAFE_MARKDOWN_URL_PATTERN = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i

function sanitizeMarkdownUrl(value: string): string | null {
  const trimmed = value.trim()
  return SAFE_MARKDOWN_URL_PATTERN.test(trimmed) ? trimmed : null
}

export function parseMarkdownContent(
  text: string,
  onLinkClick: (url: string) => void,
  isDarkMode = false,
): React.ReactNode {
  let keyIndex = 0
  const processedText = text.replace(/^\*\s+/gm, '- ')
  const lines = processedText.split('\n')
  const linkColor = isDarkMode ? 'var(--color-accent)' : 'var(--color-primary)'

  const processInlineFormatting = (line: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = []
    const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)/g

    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = inlineRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.slice(lastIndex, match.index))
      }

      if (match[1]) {
        const linkText = match[2]
        const linkUrl = sanitizeMarkdownUrl(match[3])

        if (!linkUrl) {
          elements.push(linkText)
          lastIndex = match.index + match[0].length
          continue
        }

        elements.push(
          <a
            key={`link-${keyIndex++}`}
            href={linkUrl}
            onClick={(event) => {
              event.preventDefault()
              onLinkClick(linkUrl)
            }}
            style={{
              color: linkColor,
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {linkText}
          </a>,
        )
      } else if (match[4]) {
        elements.push(
          <strong key={`bold-${keyIndex++}`} style={{ fontWeight: 600 }}>
            {match[5]}
          </strong>,
        )
      } else if (match[6]) {
        elements.push(
          <em key={`italic-${keyIndex++}`} style={{ fontStyle: 'italic' }}>
            {match[7]}
          </em>,
        )
      }

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < line.length) {
      elements.push(line.slice(lastIndex))
    }

    return elements.length > 0 ? elements : [line]
  }

  const result: React.ReactNode[] = []
  lines.forEach((line, index) => {
    result.push(...processInlineFormatting(line))
    if (index < lines.length - 1) {
      result.push(<br key={`br-${keyIndex++}`} />)
    }
  })

  return <>{result}</>
}
