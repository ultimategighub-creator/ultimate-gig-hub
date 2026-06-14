import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="page-container min-h-screen bg-navy-700 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">⚡</div>
      <h1 className="text-4xl font-black gold-text mb-2">404</h1>
      <p className="text-white font-bold text-xl mb-2">Page not found</p>
      <p className="text-navy-200 text-sm mb-8">
        This page doesn't exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-8 py-3.5 rounded-2xl bg-gold text-navy-700 font-bold text-sm
                   hover:bg-gold-400 active:scale-95 transition-all"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
