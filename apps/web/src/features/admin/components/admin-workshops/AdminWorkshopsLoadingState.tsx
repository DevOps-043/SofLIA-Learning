'use client'

export function AdminWorkshopsLoadingState() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[#E9ECEF] dark:bg-[#1E2329] rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-24 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-xl"
            />
          ))}
        </div>
        <div className="h-12 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-64 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
