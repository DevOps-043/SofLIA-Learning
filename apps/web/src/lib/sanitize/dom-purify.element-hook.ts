import { DANGEROUS_PROTOCOLS } from './dom-purify.constants';
import type { DOMPurifyInstance } from './dom-purify.instance';
import { isElementNode, isExternalUrl } from './dom-purify.node-utils';

export function configureSanitizeElementHook(domPurify: DOMPurifyInstance): void {
  domPurify.addHook('uponSanitizeElement', (node, data) => {
    const { tagName } = data;

    if (!isElementNode(node)) return;

    if (tagName === 'script' || tagName === 'style') {
      node.parentNode?.removeChild(node);
      return;
    }

    if (tagName === 'form' && node instanceof HTMLFormElement) {
      sanitizeFormElement(node);
    }

    if (tagName === 'a' && node instanceof HTMLAnchorElement) {
      hardenLinkElement(node);
    }

    if (tagName === 'img' && node instanceof HTMLImageElement) {
      sanitizeImageElement(node);
    }
  });
}

export function hardenLinkElement(linkElement: HTMLAnchorElement): void {
  if (linkElement.getAttribute('target') === '_blank') {
    const currentRel = linkElement.getAttribute('rel') || '';
    const relValues = currentRel.split(/\s+/).filter(Boolean);

    if (!relValues.includes('noopener')) relValues.push('noopener');
    if (!relValues.includes('noreferrer')) relValues.push('noreferrer');

    linkElement.setAttribute('rel', relValues.join(' '));
  }

  const href = linkElement.getAttribute('href') || '';
  if (isExternalUrl(href)) {
    linkElement.setAttribute('data-external', 'true');
  }
}

function sanitizeFormElement(formElement: HTMLFormElement): void {
  if (formElement.hasAttribute('action')) {
    const action = formElement.getAttribute('action') || '';
    if (isExternalUrl(action)) {
      formElement.removeAttribute('action');
    }
  }

  formElement.removeAttribute('onsubmit');
  formElement.removeAttribute('oninput');
}

function sanitizeImageElement(imgElement: HTMLImageElement): void {
  if (!imgElement.hasAttribute('loading')) {
    imgElement.setAttribute('loading', 'lazy');
  }

  imgElement.removeAttribute('onerror');
  imgElement.removeAttribute('onload');

  const src = imgElement.getAttribute('src') || '';
  const hasDangerousProtocol = DANGEROUS_PROTOCOLS.some((protocol) =>
    src.toLowerCase().startsWith(protocol),
  );

  if (!src || hasDangerousProtocol) {
    imgElement.remove();
  }
}
