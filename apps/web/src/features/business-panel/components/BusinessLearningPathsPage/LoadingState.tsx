export function BusinessLearningPathsLoading({ inputBg }: { inputBg: string }) {
  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-5">
      {[80, 60, 200].map((height, index) => (
        <div key={index} className="animate-pulse rounded-[2rem]" style={{ height, backgroundColor: inputBg }} />
      ))}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <div key={index} className="animate-pulse rounded-[2rem]" style={{ height: 280, backgroundColor: inputBg }} />
        ))}
      </div>
    </div>
  )
}
