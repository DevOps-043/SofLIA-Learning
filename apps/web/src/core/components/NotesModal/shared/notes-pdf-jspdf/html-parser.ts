import { normalizeNoteLinkUrl } from '../notes-modal.utils'
import { normalizeTextSegment, splitReadableTextSegments } from './text-segments'
import type { ParsedHtmlItem } from './types'

function pushBreak(items: ParsedHtmlItem[]) {
  if (items.length > 0 && items[items.length - 1]?.type !== 'break') {
    items.push({ type: 'break' })
  }
}

function nextStyleForTag(tagName: string, inheritedStyle?: string) {
  if (tagName === 'strong' || tagName === 'b') return inheritedStyle ? `${inheritedStyle},bold` : 'bold'
  if (tagName === 'em' || tagName === 'i') return inheritedStyle ? `${inheritedStyle},italic` : 'italic'
  if (tagName === 'u') return inheritedStyle ? `${inheritedStyle},underline` : 'underline'
  if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') return tagName
  return inheritedStyle
}

function processTextNode(node: Node, items: ParsedHtmlItem[], inheritedStyle?: string) {
  splitReadableTextSegments(node.textContent || '').forEach((textContent, index) => {
    if (index > 0) pushBreak(items)
    items.push({ content: textContent, style: inheritedStyle, type: 'text' })
  })
}

function processLink(element: HTMLElement, items: ParsedHtmlItem[], inheritedStyle?: string) {
  const normalizedUrl = normalizeNoteLinkUrl(element.getAttribute('href') || '')
  const linkText = normalizeTextSegment(element.textContent || normalizedUrl || '')
  if (!linkText) return
  items.push({ content: linkText, style: inheritedStyle, type: 'link', url: normalizedUrl || undefined })
}

function processList(element: HTMLElement, tagName: string, items: ParsedHtmlItem[], style?: string) {
  pushBreak(items)
  Array.from(element.querySelectorAll(':scope > li')).forEach((itemNode, index) => {
    const prefix = tagName === 'ol' ? `${index + 1}. ` : '- '
    const textContent = normalizeTextSegment(itemNode.textContent || '')
    if (textContent) items.push({ content: `${prefix}${textContent}`, style, type: 'text' })
    items.push({ type: 'break' })
  })
}

function processContainer(element: HTMLElement, items: ParsedHtmlItem[], style?: string) {
  pushBreak(items)
  Array.from(element.childNodes).forEach((childNode) => processNode(childNode, items, style))
  items.push({ type: 'break' })
}

function processNode(node: Node, items: ParsedHtmlItem[], inheritedStyle?: string) {
  if (node.nodeType === Node.TEXT_NODE) return processTextNode(node, items, inheritedStyle)
  if (node.nodeType !== Node.ELEMENT_NODE) return

  const element = node as HTMLElement
  const tagName = element.tagName.toLowerCase()
  const nextStyle = nextStyleForTag(tagName, inheritedStyle)
  if (tagName === 'script' || tagName === 'style') return
  if (tagName === 'a') return processLink(element, items, inheritedStyle)
  if (tagName === 'br') return void items.push({ type: 'break' })
  if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') return processContainer(element, items, nextStyle)
  if (tagName === 'p' || tagName === 'div') return processContainer(element, items, nextStyle)
  if (tagName === 'ul' || tagName === 'ol') return processList(element, tagName, items, nextStyle)
  Array.from(element.childNodes).forEach((childNode) => processNode(childNode, items, nextStyle))
}

export function parseNoteHtmlToPdfItems(html: string): ParsedHtmlItem[] {
  const parser = new DOMParser()
  const documentNode = parser.parseFromString(html, 'text/html')
  const items: ParsedHtmlItem[] = []
  Array.from(documentNode.body.childNodes).forEach((childNode) => processNode(childNode, items))
  return items
}
