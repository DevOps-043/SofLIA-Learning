import { describe, expect, it } from 'vitest'
import { businessPageContent } from '../content/business-page-content'
import { landingPageContent } from '../content/landing-page-content'
import { ContentService } from '../contentService'

describe('ContentService', () => {
  it('expone el contenido de landing esperado', async () => {
    await expect(ContentService.fetchLandingPageContent()).resolves.toEqual(
      landingPageContent,
    )
    await expect(ContentService.getLandingPageContent()).resolves.toEqual({
      data: landingPageContent,
      loading: false,
      error: null,
    })
  })

  it('expone el contenido de business esperado', async () => {
    await expect(ContentService.fetchBusinessPageContent()).resolves.toEqual(
      businessPageContent,
    )
    await expect(ContentService.getBusinessPageContent()).resolves.toEqual({
      data: businessPageContent,
      loading: false,
      error: null,
    })
  })
})
