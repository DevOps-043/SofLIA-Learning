import DOMPurify from 'isomorphic-dompurify'
import { hardenAnchorTags } from './dom-purify.attribute-utils'
import type { SanitizerConfig } from './html-sanitizer.types'

export function basicServerSanitize(
  html: string,
  configOrAllowedTags: SanitizerConfig | string[],
): string {
  const config: SanitizerConfig = Array.isArray(configOrAllowedTags)
    ? { ALLOWED_TAGS: configOrAllowedTags, ALLOWED_ATTR: [] }
    : configOrAllowedTags

  const sanitized = DOMPurify.sanitize(html, {
    ...config,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    CUSTOM_ELEMENT_HANDLING: {
      tagNameCheck: /^$/,
      attributeNameCheck: /^$/,
      allowCustomizedBuiltInElements: false,
    },
    IN_PLACE: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    SANITIZE_DOM: true,
  })

  return hardenAnchorTags(
    typeof sanitized === 'string' ? sanitized : String(sanitized),
  )
}
