import { describe, expect, it } from 'vitest'
import {
  buildYouTubeEmbedUrl,
  extractYouTubeVideoId,
  formatFileSize,
  hasValidAttachmentUrl,
  isMultipleAttachmentData,
  requiresAttachmentUrl,
} from '../post-attachment/service'

describe('post-attachment.service', () => {
  it('detecta payloads multiples', () => {
    expect(
      isMultipleAttachmentData({
        isMultiple: true,
        attachments: [{ attachment_type: 'image' }],
      }),
    ).toBe(true)
  })

  it('valida urls requeridas y extrae youtube id', () => {
    expect(requiresAttachmentUrl('image')).toBe(true)
    expect(hasValidAttachmentUrl('https://youtube.com/watch?v=abc123')).toBe(true)
    expect(
      extractYouTubeVideoId('https://youtube.com/watch?v=abc123'),
    ).toBe('abc123')
    expect(buildYouTubeEmbedUrl('abc123')).toBe(
      'https://www.youtube.com/embed/abc123',
    )
  })

  it('formatea tamanos de archivo', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
  })
})
