export function getActiveMobileNavItem(pathname: string): string {
  if (
    pathname.startsWith('/dashboard')
    || pathname.startsWith('/my-courses')
    || pathname.startsWith('/courses')
  ) {
    return 'workshops'
  }

  if (pathname.startsWith('/prompt-directory') || pathname.startsWith('/apps-directory')) {
    return 'directory'
  }

  if (pathname.startsWith('/communities')) {
    return 'community'
  }

  if (pathname.startsWith('/news')) {
    return 'news'
  }

  return 'workshops'
}
