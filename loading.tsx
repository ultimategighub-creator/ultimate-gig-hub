export default function Loading() {
  return (
    <div className="page-container min-h-screen bg-navy-700 px-5 pt-12">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-6 w-32" />
        </div>
        <div className="skeleton w-10 h-10 rounded-xl" />
      </div>

      {/* Card skeleton */}
      <div className="skeleton h-40 w-full rounded-2xl mb-6" />

      {/* Grid skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>

      {/* List skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
