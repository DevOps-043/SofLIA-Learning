import { mkdirSync, writeFileSync } from 'node:fs'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { dirname } from 'node:path'
import { performance } from 'node:perf_hooks'

const baseUrl = process.env.PUBLIC_PERFORMANCE_BASE_URL || process.env.LOAD_BASE_URL
const ttfbBudgetMs = Number(process.env.PUBLIC_PERFORMANCE_TTFB_BUDGET_MS || 200)
const samples = Number(process.env.PUBLIC_PERFORMANCE_SAMPLES || 3)
const outputJson = process.env.PUBLIC_PERFORMANCE_OUTPUT_JSON || 'public-performance-results/ttfb.json'
const outputMarkdown = process.env.PUBLIC_PERFORMANCE_OUTPUT_MD || 'public-performance-results/ttfb.md'

function requireBaseUrl() {
  if (!baseUrl) {
    throw new Error('PUBLIC_PERFORMANCE_BASE_URL or LOAD_BASE_URL is required')
  }
}

function buildRoutes() {
  const courseSlug = process.env.PUBLIC_PERFORMANCE_COURSE_SLUG || process.env.LOAD_COURSE_SLUG
  const newsSlug = process.env.PUBLIC_PERFORMANCE_NEWS_SLUG
  const routes = ['/', '/business', '/downloads']

  if (courseSlug) {
    routes.push(`/courses/${courseSlug}`)
  }

  if (newsSlug) {
    routes.push(`/news/${newsSlug}`)
  }

  return routes
}

function requestOnce(url) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now()
    let firstByteAt = null
    const client = url.protocol === 'https:' ? httpsRequest : httpRequest

    const req = client(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'SofLIA-public-performance-check/1.0',
        },
      },
      (res) => {
        res.once('data', () => {
          firstByteAt = performance.now()
        })
        res.on('data', () => undefined)
        res.on('end', () => {
          const endedAt = performance.now()
          resolve({
            cacheControl: res.headers['cache-control'] || null,
            cdnCacheControl: res.headers['cdn-cache-control'] || null,
            contentEncoding: res.headers['content-encoding'] || null,
            status: res.statusCode || 0,
            totalMs: Math.round(endedAt - startedAt),
            ttfbMs: Math.round((firstByteAt || endedAt) - startedAt),
          })
        })
      },
    )

    req.setTimeout(15_000, () => {
      req.destroy(new Error(`Timeout requesting ${url.toString()}`))
    })
    req.on('error', reject)
    req.end()
  })
}

function percentile(values, quantile) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)
  return sorted[index]
}

function hasExpectedCacheHeaders(route, sample) {
  const cacheControl = String(sample.cacheControl || '')

  if (route === '/' || route === '/business') {
    return cacheControl.includes('s-maxage=3600')
  }

  if (route === '/downloads' || route.startsWith('/news/')) {
    return cacheControl.includes('s-maxage=600') || cacheControl.includes('s-maxage=300')
  }

  if (route.startsWith('/courses/')) {
    return cacheControl.includes('s-maxage=300')
  }

  return cacheControl.includes('public')
}

async function measureRoute(route) {
  const url = new URL(route, baseUrl)
  const routeSamples = []

  for (let index = 0; index < samples; index += 1) {
    routeSamples.push(await requestOnce(url))
  }

  const ttfbValues = routeSamples.map((sample) => sample.ttfbMs)
  const statusOk = routeSamples.every((sample) => sample.status >= 200 && sample.status < 400)
  const cacheOk = routeSamples.every((sample) => hasExpectedCacheHeaders(route, sample))
  const p95TtfbMs = percentile(ttfbValues, 0.95)

  return {
    route,
    statusOk,
    cacheOk,
    p50TtfbMs: percentile(ttfbValues, 0.5),
    p95TtfbMs,
    maxTtfbMs: Math.max(...ttfbValues),
    pass: statusOk && cacheOk && p95TtfbMs <= ttfbBudgetMs,
    samples: routeSamples,
  }
}

function renderMarkdown(results) {
  return [
    '# Public Performance Check',
    '',
    `Base URL: ${baseUrl}`,
    `Generated at: ${new Date().toISOString()}`,
    `TTFB budget: ${ttfbBudgetMs} ms`,
    '',
    '| Route | Status | Cache | p50 TTFB | p95 TTFB | Max TTFB | Result |',
    '|---|---|---|---:|---:|---:|---|',
    ...results.map((result) => [
      `| ${result.route}`,
      result.statusOk ? 'ok' : 'fail',
      result.cacheOk ? 'ok' : 'fail',
      `${result.p50TtfbMs} ms`,
      `${result.p95TtfbMs} ms`,
      `${result.maxTtfbMs} ms`,
      result.pass ? 'pass' : 'fail',
      '|',
    ].join(' | ')),
    '',
  ].join('\n')
}

function writeResultFiles(results) {
  mkdirSync(dirname(outputJson), { recursive: true })
  mkdirSync(dirname(outputMarkdown), { recursive: true })
  writeFileSync(outputJson, JSON.stringify({
    baseUrl,
    generatedAt: new Date().toISOString(),
    ttfbBudgetMs,
    results,
  }, null, 2))
  writeFileSync(outputMarkdown, renderMarkdown(results))
}

requireBaseUrl()
const results = []

for (const route of buildRoutes()) {
  results.push(await measureRoute(route))
}

writeResultFiles(results)

const failed = results.filter((result) => !result.pass)
if (failed.length > 0) {
  throw new Error(`Public performance budget failed for: ${failed.map((result) => result.route).join(', ')}`)
}
