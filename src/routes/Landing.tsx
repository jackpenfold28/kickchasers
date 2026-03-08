import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BarChart3, ShieldCheck, Users } from 'lucide-react'

type ShowcaseShot = {
  title: string
  caption: string
  src: string
  fallback: string
}

const heroShot = '/mockups/landing/01-see-every-match-moment.png'

const showcaseShots: ShowcaseShot[] = [
  { title: 'Live Game Tracking', caption: 'Capture every action as it happens.', src: '/mockups/landing/02-track-every-afl-stat-live.png', fallback: '/mockups/mobile-game.png' },
  { title: 'Player Performance Insights', caption: 'Break down individual impact quarter by quarter.', src: '/mockups/landing/07-see-whos-dominating.png', fallback: '/mockups/summary.png' },
  { title: 'Squad Management', caption: 'Run teams, rosters, roles and permissions at scale.', src: '/mockups/landing/06-manage-your-club.png', fallback: '/mockups/hub.png' },
  { title: 'Match Summaries', caption: 'Professional post-game analysis in seconds.', src: '/mockups/landing/08-live-team-stats.png', fallback: '/mockups/summary.png' },
  { title: 'Development Trends', caption: 'Track season progression with benchmarked data.', src: '/mockups/landing/10-your-complete-player-profile.png', fallback: '/mockups/hub.png' },
  { title: 'Live Game Feed', caption: 'Monitor every match moment in real time.', src: '/mockups/landing/01-see-every-match-moment.png', fallback: '/mockups/mobile-game.png' },
  { title: 'Leaderboards', caption: 'Compare rank and output across your competition.', src: '/mockups/landing/03-climb-the-leaderboards.png', fallback: '/mockups/hub.png' },
  { title: 'Dual Tracker Sync', caption: 'Link opponent trackers for full-game context.', src: '/mockups/landing/04-two-trackers-one-game.png', fallback: '/mockups/new-game.png' },
  { title: 'Follow Local Footy', caption: 'Watch scores and stats from local leagues.', src: '/mockups/landing/05-follow-local-footy.png', fallback: '/mockups/live-viewer.png' },
  { title: 'Auto Summaries', caption: 'Generate polished game reports automatically.', src: '/mockups/landing/09-professional-match-summaries.png', fallback: '/mockups/summary.png' },
  { title: 'Club Content Creation', caption: 'Produce social-ready cards and lineup graphics.', src: '/mockups/landing/11-instant-club-content-creation.png', fallback: '/mockups/hub.png' },
  { title: 'Share Highlights', caption: 'Turn match performance into shareable moments.', src: '/mockups/landing/12-share-your-match-performance.png', fallback: '/mockups/live-viewer.png' },
]

const audience = [
  'Players chasing improvement',
  'Parents tracking development',
  'Clubs analysing performance',
  'Coaches reviewing matches',
]

const topStats = [
  { label: 'Disposals', value: '24' },
  { label: 'Efficiency', value: '82%' },
  { label: 'Score Involvements', value: '11' },
  { label: 'Tackles', value: '9' },
  { label: 'Inside 50s', value: '7' },
]

function ShotCard({ shot, className = '' }: { shot: ShowcaseShot; className?: string }) {
  const [src, setSrc] = useState(shot.src)
  return (
    <article className={`group rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] ${className}`}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#020919]">
        <img
          src={src}
          alt={shot.title}
          loading="lazy"
          onError={() => setSrc(shot.fallback)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{shot.title}</h3>
      <p className="mt-1 text-sm text-slate-300">{shot.caption}</p>
    </article>
  )
}

function HeroMockup() {
  const [src, setSrc] = useState(heroShot)
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-8 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.30),transparent_65%)] blur-3xl" />
      <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] p-3 shadow-[0_32px_120px_rgba(0,0,0,0.65)]">
        <img
          src={src}
          alt="KickChasers app screenshot"
          onError={() => setSrc('/mockups/mobile-game.png')}
          className="h-full w-full rounded-[1.5rem] object-cover"
        />
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <main className="relative overflow-hidden bg-[#02091A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_500px_at_10%_-10%,rgba(16,96,255,0.28),transparent_60%),radial-gradient(900px_500px_at_100%_0%,rgba(57,255,20,0.12),transparent_45%),linear-gradient(180deg,#02091A_0%,#020714_45%,#040B1D_100%)]" />

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-8 lg:px-10">
        <div className="flex items-center gap-3">
          <img src="/kickchasers_logo.png" alt="KickChasers" className="h-10 w-auto" />
          <span className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">Performance Platform</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/login" className="rounded-xl border border-white/15 px-4 py-2 text-slate-200 transition hover:border-white/30 hover:text-white">Log In</Link>
          <Link to="/register" className="rounded-xl bg-[#39FF14] px-4 py-2 font-semibold text-[#07111F] transition hover:brightness-110">Create Account</Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl gap-16 px-6 pb-24 pt-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pt-14">
        <div className="kc-rise">
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
            <Link to="/register" className="rounded-xl bg-[#39FF14] px-7 py-3 text-base font-semibold text-[#07111F] transition hover:brightness-110">
              Get Started
            </Link>
            <a href="#product-demo" className="rounded-xl border border-white/20 px-7 py-3 text-base font-semibold text-white transition hover:border-white/35">
              View Demo
            </a>
          </div>
        </div>
        <div className="kc-rise-delayed">
          <HeroMockup />
        </div>
      </section>

      <section id="product-demo" className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 kc-rise">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Product Demonstration</h2>
          <p className="hidden max-w-md text-right text-sm text-slate-400 md:block">Real screenshots from the KickChasers mobile platform.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {showcaseShots.map((shot, idx) => {
            const stagger = idx % 3 === 1 ? 'xl:-translate-y-8' : idx % 3 === 2 ? 'xl:translate-y-8' : ''
            return <ShotCard key={shot.title} shot={shot} className={stagger} />
          })}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 kc-rise">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Why KickChasers</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <Activity className="h-6 w-6 text-[#39FF14]" />
            <h3 className="mt-4 text-2xl font-semibold">Track Every Stat</h3>
            <p className="mt-2 text-slate-300">Capture detailed in-game data effortlessly with fast, match-ready workflows.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <BarChart3 className="h-6 w-6 text-[#39FF14]" />
            <h3 className="mt-4 text-2xl font-semibold">Measure Player Development</h3>
            <p className="mt-2 text-slate-300">See progress across seasons and matches with context-rich analytics.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <Users className="h-6 w-6 text-[#39FF14]" />
            <h3 className="mt-4 text-2xl font-semibold">Built for Grassroots Football</h3>
            <p className="mt-2 text-slate-300">Designed for players, parents, coaches and clubs in real local competitions.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <ShieldCheck className="h-6 w-6 text-[#39FF14]" />
            <h3 className="mt-4 text-2xl font-semibold">Elite-Level Insights</h3>
            <p className="mt-2 text-slate-300">Get the type of performance visibility usually reserved for professional programs.</p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 kc-rise">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#051129] via-[#071735] to-[#050E1E] p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Performance Dashboard</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Know Your Numbers</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {topStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#39FF14] kc-pulse">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#020918] p-5 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Match Trend</p>
              <div className="mt-4 grid grid-cols-8 items-end gap-2">
                {[35, 42, 39, 56, 54, 63, 70, 78].map((height, idx) => (
                  <div key={idx} className="rounded-md bg-gradient-to-t from-[#123D8A] to-[#39FF14]/75" style={{ height: `${height}px` }} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#020918] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Rating</p>
              <p className="mt-3 text-5xl font-semibold text-[#39FF14]">8.7</p>
              <p className="mt-2 text-sm text-slate-300">Above benchmark across pressure and score involvements.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 kc-rise">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Trusted Across Local Football</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-200">
              {item}
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 kc-rise">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#0A1C3D] to-[#071125] p-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Start Tracking Your Game</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Join the next generation of football performance tracking.
          </p>
          <Link to="/register" className="mt-8 inline-flex rounded-xl bg-[#39FF14] px-8 py-3 text-base font-semibold text-[#07111F] transition hover:brightness-110">
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
            <Link to="/hub" className="hover:text-white">Portal</Link>
            <span className="text-slate-500">Privacy</span>
            <span className="text-slate-500">Terms</span>
          </nav>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} KickChasers. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
