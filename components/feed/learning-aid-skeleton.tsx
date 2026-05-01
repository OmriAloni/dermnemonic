// Loading skeleton for learning aid cards
export function LearningAidSkeleton() {
  return (
    <div className="bg-card rounded-lg p-6 space-y-4 animate-pulse">
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>

      {/* Body text */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap">
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
      </div>

      {/* Uploader and stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <LearningAidSkeleton key={i} />
      ))}
    </div>
  )
}
