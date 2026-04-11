import { expect, test, type Page } from '@playwright/test'

const viewports = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1536', width: 1536, height: 864 },
] as const

type TableMode = 'report' | 'analytics-users' | 'generic' | null

const scenarios: Array<{
  id: string
  path: string
  hasTabs?: boolean
  modalTestId?: string
  tableMode?: TableMode
}> = [
  {
    id: 'admin-dashboard',
    path: '/responsive-smoke/admin-dashboard',
    tableMode: 'generic',
  },
  {
    id: 'admin-workshops',
    path: '/responsive-smoke/admin-workshops',
    tableMode: 'generic',
  },
  {
    id: 'course-management',
    path: '/responsive-smoke/course-management',
    hasTabs: true,
    modalTestId: 'lesson-modal-panel',
  },
  {
    id: 'admin-users-modal',
    path: '/responsive-smoke/admin-users-modal',
    modalTestId: 'admin-users-modal-panel',
    tableMode: 'generic',
  },
  {
    id: 'business-dashboard',
    path: '/responsive-smoke/business-dashboard',
    tableMode: 'report',
  },
  {
    id: 'business-reports',
    path: '/responsive-smoke/business-reports',
    tableMode: 'report',
  },
  {
    id: 'business-users-modal',
    path: '/responsive-smoke/business-users-modal',
    modalTestId: 'business-add-user-modal-panel',
    tableMode: 'analytics-users',
  },
  {
    id: 'instructor-course-management',
    path: '/responsive-smoke/instructor-course-management',
    hasTabs: true,
  },
  {
    id: 'select-organization',
    path: '/responsive-smoke/select-organization',
  },
  {
    id: 'business-public',
    path: '/responsive-smoke/business-public',
  },
]

async function getHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const body = document.body
    return Math.max(
      doc.scrollWidth - doc.clientWidth,
      body.scrollWidth - body.clientWidth,
      0,
    )
  })
}

for (const viewport of viewports) {
  for (const scenario of scenarios) {
    test(`${scenario.id} renders without overflow at ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })

      await page.goto(scenario.path)
      await expect(page.getByTestId('responsive-smoke-root')).toBeVisible()

      const overflow = await getHorizontalOverflow(page)
      expect(overflow).toBeLessThanOrEqual(1)

      if (scenario.hasTabs) {
        const tabs = page.getByTestId('responsive-smoke-tabs')
        await expect(tabs).toBeVisible()
        const tabsBox = await tabs.boundingBox()
        expect(tabsBox?.width ?? 0).toBeLessThanOrEqual(viewport.width + 1)
      }

      if (scenario.modalTestId) {
        const modal = page.getByTestId(scenario.modalTestId)
        await expect(modal).toBeVisible()
        const modalBox = await modal.boundingBox()
        expect(modalBox?.width ?? 0).toBeLessThanOrEqual(viewport.width + 1)
        expect(modalBox?.height ?? 0).toBeLessThanOrEqual(viewport.height + 1)
      }

      if (scenario.tableMode === 'report') {
        const desktop = page.getByTestId('report-table-desktop')
        const mobile = page.getByTestId('report-table-mobile')

        if (viewport.width < 768) {
          await expect(mobile).toBeVisible()
          await expect(desktop).not.toBeVisible()
        } else {
          await expect(desktop).toBeVisible()
          await expect(mobile).not.toBeVisible()
        }
      }

      if (scenario.tableMode === 'analytics-users') {
        const desktop = page.getByTestId('business-analytics-users-desktop')
        const mobile = page.getByTestId('business-analytics-users-mobile')

        if (viewport.width < 768) {
          await expect(mobile).toBeVisible()
          await expect(desktop).not.toBeVisible()
        } else {
          await expect(desktop).toBeVisible()
          await expect(mobile).not.toBeVisible()
        }
      }

      if (scenario.tableMode === 'generic') {
        if (viewport.width < 768) {
          await expect(page.locator('table').first()).not.toBeVisible()
        } else {
          await expect(page.locator('table').first()).toBeVisible()
        }
      }
    })
  }
}
