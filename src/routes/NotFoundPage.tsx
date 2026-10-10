import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070F1E] px-4 py-12 text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0B1324] p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">That page isn’t available.</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
          The link may be outdated, or the page may have moved. Return to a supported KickChasers destination.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="btn btn-primary" to="/dashboard">Go to Dashboard</Link>
          <Link className="btn btn-secondary" to="/">Go to Home</Link>
        </div>
      </section>
    </main>
  )
}
