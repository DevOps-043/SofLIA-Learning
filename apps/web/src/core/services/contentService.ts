import type {
  BusinessPageContent,
  LandingPageContent,
} from '@aprende-y-aplica/shared'
import { businessPageContent } from './content/business-page-content'
import { resolveContentState } from './content/content-state'
import { landingPageContent } from './content/landing-page-content'

const CONTENT_FETCH_DELAY_MS = 100

async function simulateContentFetch<T>(content: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, CONTENT_FETCH_DELAY_MS))
  return content
}

export class ContentService {
  static async fetchLandingPageContent(): Promise<LandingPageContent> {
    try {
      return await simulateContentFetch(landingPageContent)
    } catch {
      return landingPageContent
    }
  }

  static async getLandingPageContent() {
    return resolveContentState(() => this.fetchLandingPageContent())
  }

  static async fetchBusinessPageContent(): Promise<BusinessPageContent> {
    try {
      return await simulateContentFetch(businessPageContent)
    } catch {
      return businessPageContent
    }
  }

  static async getBusinessPageContent() {
    return resolveContentState(() => this.fetchBusinessPageContent())
  }
}
