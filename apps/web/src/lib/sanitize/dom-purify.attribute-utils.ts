export function getAttributeValue(
  attributes: string,
  attributeName: string
): string | null {
  const match = attributes.match(
    new RegExp(`${attributeName}\\s*=\\s*["']([^"']*)["']`, 'i'),
  );

  return match?.[1] ?? null;
}

export function upsertAttribute(
  attributes: string,
  attributeName: string,
  value: string
): string {
  const attributePattern = new RegExp(
    `${attributeName}\\s*=\\s*["'][^"']*["']`,
    'i',
  );

  if (attributePattern.test(attributes)) {
    return attributes.replace(attributePattern, `${attributeName}="${value}"`);
  }

  return `${attributes.trimEnd()} ${attributeName}="${value}"`;
}

export function hardenAnchorTags(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_fullMatch, rawAttributes: string) => {
    let attributes = rawAttributes;
    const href = getAttributeValue(attributes, 'href');
    const target = getAttributeValue(attributes, 'target');

    if (target === '_blank') {
      const relValues = new Set(
        (getAttributeValue(attributes, 'rel') || '')
          .split(/\s+/)
          .filter(Boolean),
      );

      relValues.add('noopener');
      relValues.add('noreferrer');
      attributes = upsertAttribute(attributes, 'rel', Array.from(relValues).join(' '));
    }

    if (href && /^https?:\/\//i.test(href)) {
      attributes = upsertAttribute(attributes, 'data-external', 'true');
    }

    return `<a${attributes}>`;
  });
}
