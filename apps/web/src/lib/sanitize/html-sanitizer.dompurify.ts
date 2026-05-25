'use client'

import DOMPurifyLib from 'dompurify'

let DOMPurify: typeof DOMPurifyLib | null = null

if (typeof window !== 'undefined') {
  DOMPurify = DOMPurifyLib
}

export function getDOMPurify(): typeof DOMPurifyLib | null {
  return DOMPurify
}
