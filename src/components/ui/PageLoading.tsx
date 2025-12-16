export function PageLoading({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
      <div className="w-full max-w-3xl">
        <div className="animate-pulse">
          <div className="h-10 bg-zinc-900 rounded-md mb-6" />
          <div className="h-64 bg-zinc-900 rounded-2xl mb-4" />
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="h-6 bg-zinc-900 rounded" />
            <div className="h-6 bg-zinc-900 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-zinc-900 rounded" />
            <div className="h-4 bg-zinc-900 rounded" />
            <div className="h-4 bg-zinc-900 rounded w-5/6" />
          </div>
          <div className="mt-6 text-zinc-500 text-sm">{message}</div>
        </div>
      </div>
    </div>
  );
}
