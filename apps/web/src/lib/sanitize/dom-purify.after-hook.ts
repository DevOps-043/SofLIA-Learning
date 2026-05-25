import type { DOMPurifyInstance } from './dom-purify.instance';
import { hardenLinkElement } from './dom-purify.element-hook';
import { isElementNode } from './dom-purify.node-utils';

export function configureAfterSanitizeAttributesHook(
  domPurify: DOMPurifyInstance
): void {
  domPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!isElementNode(node)) return;

    if (node instanceof HTMLAnchorElement) {
      hardenLinkElement(node);
    }

    for (const attribute of Array.from(node.attributes)) {
      if (attribute.name.toLowerCase().startsWith('on')) {
        node.removeAttribute(attribute.name);
      }
    }
  });
}
