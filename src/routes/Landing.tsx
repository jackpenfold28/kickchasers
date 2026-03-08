import { Link } from 'react-router-dom'
import { useState } from 'react'

const authLink = (path: string) => `/login?next=${encodeURIComponent(path)}`

type Shot = {
  title: string
  caption: string
  src: string
  fallback: string
}

const heroShot = '/mockups/landing/01-see-every-match-moment.png'

const shots: Shot[] = [
  { title: 'Live Game Tracking', caption: 'Capture every action in real time.', src: '/mockups/landing/02-track-every-afl-stat-live.png', fallback: '/mockups/live-viewer.png' },
  { title: 'Leaderboards', caption: 'See who is setting the pace each week.', src: '/mockups/landing/03-climb-the-leaderboards.png', fallback: '/mockups/hub.png' },
  { title: 'Two Trackers. One Game.', caption: 'Link both teams for complete context.', src: '/mockups/landing/04-two-trackers-one-game.png', fallback: '/mockups/live-viewer.png' },
  { title: 'Squad Management', caption: 'Run club operations from one platform.', src: '/mockups/landing/06-manage-your-club.png', fallback: '/mockups/hub.png' },
  { title: 'Player Ratings', caption: 'Benchmark output and impact instantly.', src: '/mockups/landing/07-see-whos-dominating.png', fallback: '/mockups/hub.png' },
  { title: 'Match Summaries', caption: 'Professional breakdowns after every game.', src: '/mockups/landing/08-live-team-stats.png', fallback: '/mockups/live-viewer.png' },
  { title: 'Player Development', caption: 'Track progression across the season.', src: '/mockups/landing/10-your-complete-player-profile.png', fallback: '/mockups/hub.png' },
  { title: 'Club Content', caption: 'Generate social-ready cards and graphics.', src: '/mockups/landing/11-instant-club-content-creation.png', fallback: '/mockups/live-viewer.png' },
  { title: 'Share Highlights', caption: 'Turn match data into momentum.', src: '/mockups/landing/12-share-your-match-performance.png', fallback: '/mockups/live-viewer.png' },
]

const audience = [
  'Players chasing improvement',
  'Parents tracking development',
  'Clubs analysing performance',
  'Coaches reviewing matches',
]

function ShotImage({ shot, className }: { shot: Shot; className?: string }) {
  const [src, setSrc] = useState(shot.src)
  return (
    <img
      src={src}
      alt={shot.title}
      loading="lazy"
      onError={() => setSrc(shot.fallback)}
      className={className ?? 'h-full w-full object-cover'}
    />
  )
}

function HeroImage() {
  const [src, setSrc] = useState(heroShot)
  return (
    <div className="relative mx-auto w-full max-w-[380px] lg:max-w-[420px]">
      <div className="absolute -inset-8 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.30),transparent_65%)] blur-3xl" />
      <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] p-2.5 shadow-[0_32px_120px_rgba(0,0,0,0.65)]">
        <img
          src={src}
          alt="KickChasers app"
          onError={() => setSrc('/mockups/live-viewer.png')}
          className="h-full w-full rounded-[1.5rem] object-cover"
        />
      </div>
    </div>
  )
}

export default function Landing() {
  const [activeShot, setActiveShot] = useState(0)
  const prevShot = () => setActiveShot((i) => (i === 0 ? shots.length - 1 : i - 1))
  const nextShot = () => setActiveShot((i) => (i + 1) % shots.length)

  return (
    <main className="relative overflow-hidden bg-[#02091A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_500px_at_10%_-10%,rgba(16,96,255,0.28),transparent_60%),radial-gradient(900px_500px_at_100%_0%,rgba(57,255,20,0.12),transparent_45%),linear-gradient(180deg,#02091A_0%,#020714_45%,#040B1D_100%)]" />

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-8 lg:px-10">
        <div className="flex items-center gap-3">
          <img src="/kickchasers_logo.png" alt="KickChasers" className="h-10 w-auto" />
          <span className="text-sm uppercase tracking-[0.24em] text-slate-300">Performance Platform</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/login" className="rounded-xl border border-white/15 px-4 py-2 text-slate-200 hover:border-white/30 hover:text-white">Log In</Link>
          <Link to="/register" className="rounded-xl bg-[#39FF14] px-4 py-2 font-semibold text-[#07111F] hover:brightness-110">Create Account</Link>
        </div>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl gap-14 px-6 pb-24 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10">
        <div>
          <p className="mb-6 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-slate-300">
            Built For Australian Rules Football
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
            Track Your Performance.
            <span className="block text-[#39FF14]">Chase the Next Level.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300">
            KickChasers is the performance platform for Australian Rules Football. Track games, measure development,
            and unlock elite-level insights.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to={authLink('/new')} className="rounded-xl bg-[#39FF14] px-7 py-3 text-base font-semibold text-[#07111F] hover:brightness-110">
              Get Started
            </Link>
            <a href="#product-demo" className="rounded-xl border border-white/20 px-7 py-3 text-base font-semibold text-white hover:border-white/35">
              View Demo
            </a>
          </div>
        </div>
        <HeroImage />
      </section>

      <section id="product-demo" className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Product Demonstration</h2>
          <p className="hidden max-w-md text-right text-sm text-slate-400 md:block">Real screenshots from the KickChasers mobile platform.</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-7">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#020919]">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeShot * 100}%)` }}
            >
              {shots.map((shot) => (
                <div key={shot.title} className="min-w-full p-4 sm:p-7">
                  <div className="mx-auto max-w-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#020c22] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
                    <div className="aspect-[10/16]">
                      <ShotImage shot={shot} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="mx-auto mt-5 max-w-2xl text-center">
                    <h3 className="text-2xl font-semibold text-white">{shot.title}</h3>
                    <p className="mt-2 text-slate-300">{shot.caption}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={prevShot}
              aria-label="Previous screenshot"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-white backdrop-blur hover:border-white/35"
            >
              ←
            </button>
            <button
              type="button"
              onClick={nextShot}
              aria-label="Next screenshot"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-white backdrop-blur hover:border-white/35"
            >
              →
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {shots.map((shot, idx) => (
              <button
                key={shot.title}
                type="button"
                onClick={() => setActiveShot(idx)}
                aria-label={`Go to ${shot.title}`}
                className={`h-2.5 rounded-full transition-all ${activeShot === idx ? 'w-8 bg-[#39FF14]' : 'w-2.5 bg-white/35 hover:bg-white/60'}`}
              />
            ))}
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
            {shots.map((shot, idx) => (
              <button
                key={`${shot.title}-thumb`}
                type="button"
                onClick={() => setActiveShot(idx)}
                className={`shrink-0 overflow-hidden rounded-xl border ${activeShot === idx ? 'border-[#39FF14]' : 'border-white/15'} bg-[#020919]`}
              >
                <div className="h-24 w-16">
                  <ShotImage shot={shot} className="h-full w-full object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Know Your Numbers</h2>
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#051129] via-[#071735] to-[#050E1E] p-8 sm:p-10">
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { label: 'Disposals', value: '24' },
              { label: 'Efficiency', value: '82%' },
              { label: 'Score Involvements', value: '11' },
              { label: 'Tackles', value: '9' },
              { label: 'Inside 50s', value: '7' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-[#39FF14]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Trusted Across Local Football</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-200">
              {item}
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#0A1C3D] to-[#071125] p-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Start Tracking Your Game</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Join the next generation of football performance tracking.</p>
          <Link to="/register" className="mt-8 inline-flex rounded-xl bg-[#39FF14] px-8 py-3 text-base font-semibold text-[#07111F] hover:brightness-110">
            Create Account
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-white/10 bg-[#030A1A]/95">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <img src="/kickchasers_logo.png" alt="KickChasers" className="h-10 w-auto" />
            <span className="text-sm text-slate-300">KickChasers</span>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
            <Link to="/login" className="hover:text-white">Login</Link>
            <Link to="/register" className="hover:text-white">Register</Link>
            <Link to={authLink('/hub')} className="hover:text-white">Portal</Link>
            <span className="text-slate-500">Privacy</span>
            <span className="text-slate-500">Terms</span>
          </nav>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} KickChasers. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
