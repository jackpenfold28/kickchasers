import { Link } from 'react-router-dom'

export default function Landing(){
  return (
    <main className="min-h-screen app-bg p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="card p-6">
          <div className="flex items-center gap-4">
            <img src="/kickchasers_logo.png" alt="KickChasers" className="h-14 w-auto" />
            <div>
              <h1 className="h1">KickChasers Web Portal</h1>
              <p className="text-white/80">Profile, squads, and dashboard administration.</p>
            </div>
          </div>
        </header>

        <section className="card p-6">
          <h2 className="text-lg font-semibold">Portal Scope</h2>
          <ul className="mt-3 text-white/80 text-sm space-y-1">
            <li>Authentication and account access</li>
            <li>Profile and team logo management</li>
            <li>Squad overview and membership visibility</li>
            <li>Dashboard shell for web administration</li>
          </ul>
          <div className="mt-5 flex gap-2">
            <Link to="/login" className="btn btn-primary">Log In</Link>
            <Link to="/register" className="btn">Create Account</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
