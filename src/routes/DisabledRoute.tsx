import { Link } from 'react-router-dom'

export default function DisabledRoute(){
  return (
    <main className="min-h-screen p-6 app-bg">
      <div className="mx-auto max-w-2xl card p-6 space-y-4">
        <h1 className="h1">Disabled In Portal Phase</h1>
        <p className="text-white/80">
          This route belongs to legacy game-day tracking flows and is intentionally disabled while the web app is scoped to dashboard/portal functionality.
        </p>
        <div className="flex gap-2">
          <Link className="btn btn-primary" to="/hub">Go to Dashboard</Link>
          <Link className="btn" to="/squad">Go to Squads</Link>
          <Link className="btn" to="/profile">Go to Profile</Link>
        </div>
      </div>
    </main>
  )
}
