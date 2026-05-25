export function BusinessErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-carbon flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
        <p className="text-white/70 mb-8">{message}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary">
          Reintentar
        </button>
      </div>
    </main>
  )
}
