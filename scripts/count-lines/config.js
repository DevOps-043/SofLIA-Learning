const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.cache',
  '.vercel',
  '.netlify',
  'coverage',
  '.nyc_output',
  '__pycache__',
  '.svn',
  '.hg',
  '.agent',
  '.claude',
  '.playwright-mcp',
  'tmp',
  'database-optimization',
  'scratch',
  'traducir',
])

const EXCLUDED_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'deno.lock',
  '.DS_Store',
  'Thumbs.db',
  'tsconfig.tsbuildinfo',
  'debug_payload.json',
])

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.webp',
  '.avif',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.pdf',
  '.docx',
  '.xlsx',
  '.pptx',
  '.zip',
  '.gz',
  '.tar',
  '.mp4',
  '.mp3',
  '.wav',
  '.ogg',
  '.webm',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
])

const WORKSPACES = [
  { name: 'apps/web', path: path.join(ROOT, 'apps', 'web') },
  { name: 'apps/api', path: path.join(ROOT, 'apps', 'api') },
  { name: 'packages/shared', path: path.join(ROOT, 'packages', 'shared') },
  { name: 'packages/ui', path: path.join(ROOT, 'packages', 'ui') },
  { name: 'supabase', path: path.join(ROOT, 'supabase') },
  { name: 'scripts', path: path.join(ROOT, 'scripts') },
]

module.exports = {
  BINARY_EXTENSIONS,
  EXCLUDED_DIRS,
  EXCLUDED_FILES,
  ROOT,
  WORKSPACES,
}
