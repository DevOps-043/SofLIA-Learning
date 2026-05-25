const baseUrl = process.env.PUBLIC_PERFORMANCE_BASE_URL || process.env.LOAD_BASE_URL
const courseSlug = process.env.PUBLIC_PERFORMANCE_COURSE_SLUG || process.env.LOAD_COURSE_SLUG
const newsSlug = process.env.PUBLIC_PERFORMANCE_NEWS_SLUG

if (!baseUrl) {
  throw new Error('PUBLIC_PERFORMANCE_BASE_URL or LOAD_BASE_URL is required')
}

const paths = ['/', '/business', '/downloads']
if (courseSlug) paths.push(`/courses/${courseSlug}`)
if (newsSlug) paths.push(`/news/${newsSlug}`)

module.exports = {
  ci: {
    collect: {
      numberOfRuns: Number(process.env.PUBLIC_PERFORMANCE_LIGHTHOUSE_RUNS || 1),
      settings: {
        chromeFlags: '--no-sandbox --headless=new',
        onlyCategories: ['performance'],
      },
      url: paths.map((path) => new URL(path, baseUrl).toString()),
    },
    assert: {
      assertions: {
        'categories:performance': [
          'error',
          { minScore: Number(process.env.PUBLIC_PERFORMANCE_LIGHTHOUSE_MIN_SCORE || 0.9) },
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: process.env.PUBLIC_PERFORMANCE_LIGHTHOUSE_OUTPUT_DIR || 'public-performance-results/lighthouse',
    },
  },
}
