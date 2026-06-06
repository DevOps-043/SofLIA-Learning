import { RouteLoadingSpinner } from '@/core/components/Skeletons/RouteLoadingSpinner'

// Cubre la entrada a cualquier ruta de organizacion mientras el layout de servidor
// `[orgSlug]/layout.tsx` resuelve sesion + organizacion + membresia.
export default function Loading() {
  return <RouteLoadingSpinner />
}
