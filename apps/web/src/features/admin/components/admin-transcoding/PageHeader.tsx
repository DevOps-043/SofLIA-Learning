import { ServerStackIcon } from '@heroicons/react/24/outline'

export function PageHeader() {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <ServerStackIcon className="h-7 w-7 text-[#0A2540] dark:text-[#00D4B3]" />
        <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white">
          Transcoding de video
        </h1>
      </div>
      <p className="text-sm text-[#6C757D] dark:text-white/60">
        Procesamiento HLS adaptativo de videos de cursos. Los jobs se ejecutan
        como Netlify Background Functions.
      </p>
    </header>
  )
}
