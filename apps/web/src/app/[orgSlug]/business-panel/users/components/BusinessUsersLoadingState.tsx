'use client'

export function BusinessUsersLoadingState() {
  return (
    <div className="min-h-screen animate-pulse p-6">
      <div className="mb-8 h-48 rounded-3xl bg-gray-200 dark:bg-gray-800/50" />
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-gray-200 dark:bg-gray-800/50" />
        ))}
      </div>
      <div className="mb-6 h-12 rounded-xl bg-gray-200 dark:bg-gray-800/50" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800/50" />
        ))}
      </div>
    </div>
  )
}
