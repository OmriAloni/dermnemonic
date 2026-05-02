export function AidDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="h-5 w-20 bg-muted animate-pulse rounded" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
              <div className="h-5 w-12 bg-muted animate-pulse rounded" />
              <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Image skeleton */}
        <div className="aspect-video bg-muted animate-pulse rounded-lg mb-6" />

        <div className="mb-6">
          {/* Title skeleton */}
          <div className="h-9 w-3/4 bg-muted animate-pulse rounded mb-4" />

          {/* Uploader info skeleton */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>

          {/* Body skeleton */}
          <div className="space-y-2 mb-6">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4/6 bg-muted animate-pulse rounded" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        </div>

        {/* Comments section skeleton */}
        <div className="mt-8">
          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
