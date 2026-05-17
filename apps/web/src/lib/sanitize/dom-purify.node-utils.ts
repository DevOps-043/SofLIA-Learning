export function stripHtmlPreservingText(html: string): string {
  if (!html) return '';

  if (typeof window !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  return html.replace(/<[^>]*>/g, '');
}

export function isElementNode(node: Node): node is Element {
  return node instanceof Element;
}

export function toSanitizedString(value: string | Node): string {
  if (typeof value === 'string') return value;
  if (value instanceof Element) return value.outerHTML;
  return value.textContent ?? '';
}

export function isExternalUrl(url: string): boolean {
  return typeof window !== 'undefined' && window.location
    ? url.startsWith('http') && !url.includes(window.location.hostname)
    : false;
}
