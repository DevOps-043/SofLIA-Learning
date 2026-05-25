export function LoadingState() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
