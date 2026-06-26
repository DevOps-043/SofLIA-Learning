import { RouteLoadingSpinner } from '@/core/components/Skeletons/RouteLoadingSpinner'

// Without this file Next.js keeps the previous page (landing) frozen while the
// org-specific auth page's JS loads and hydrates.  With it, the router wraps
// the segment in a Suspense boundary and shows this spinner immediately on
// navigation — giving instant visual feedback before any JS runs on the client.
export default function Loading() {
  return <RouteLoadingSpinner />
}
