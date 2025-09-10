import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
const authLink = (path: string) => `/login?next=${encodeURIComponent(path)}`

export default function Landing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0
      setScrolled(y > 8)
      const h = document.documentElement
      const progress = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100
      setScrollProgress(progress)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const gallery = [
    { src: "/mockups/hub.png", caption: "Hub — manage games & sharing" },
    { src: "/mockups/mobile-game.png", caption: "In‑game logging (mobile)" },
    { src: "/mockups/live-viewer.png", caption: "Live viewer — share with fans" },
    { src: "/mockups/summary.png", caption: "Post‑game summary & PDF export" }
  ]
  const [idx, setIdx] = useState(0)
  const next = () => setIdx((i) => (i + 1) % gallery.length)
  const prev = () => setIdx((i) => (i - 1 + gallery.length) % gallery.length)

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* soft gradient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[42vw] h-[42vw] rounded-full bg-emerald-400/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -right-32 w-[38vw] h-[38vw] rounded-full bg-cyan-400/10 blur-[100px] animate-pulse" />
      </div>

      {/* scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5">
        <div
          className="h-full bg-emerald-400 transition-[width] duration-200 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* NAV */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? 'backdrop-blur-md bg-slate-900/60 border-b border-white/10 py-2' : 'backdrop-blur-0 bg-transparent py-3'}`}>
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              src="/kickchasers_logo.png"
              alt="Kickchasers"
              className="h-16 md:h-20 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm opacity-90">
            <a href="#features" className="group relative hover:opacity-100">
              <span>Features</span>
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#how" className="group relative hover:opacity-100">
              <span>How it works</span>
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#share" className="group relative hover:opacity-100">
              <span>Live sharing</span>
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#gallery" className="group relative hover:opacity-100">
              <span>How it looks</span>
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#testimonials" className="group relative hover:opacity-100">
              <span>Testimonials</span>
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-1.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-sm">
              Log in
            </Link>
            <Link to="/register" className="px-3 py-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-sm">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pt-28 pb-10 md:pt-32 md:pb-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Live AFL-style stats.
              <span className="block text-emerald-300">One tap. Zero clutter.</span>
            </h1>
            <p className="mt-4 text-[15px] md:text-base opacity-80 max-w-xl">
              Kickchasers is the fastest way to capture disposals, contested/uncontested, effectiveness,
              and scores in real time—then share a beautiful live viewer link with your club.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={authLink('/new')}
                className="px-4 py-2 rounded-md border border-emerald-400/40 bg-emerald-500/20 hover:bg-emerald-500/30 font-medium transition transform hover:scale-[1.03] shadow-lg shadow-emerald-500/10"
              >
                Create a game
              </Link>
              <Link
                to={authLink('/hub')}
                className="px-4 py-2 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 font-medium transition transform hover:scale-[1.02]"
              >
                Go to Hub
              </Link>
              <Link
                to="/summary/demo"
                className="px-4 py-2 rounded-md border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 font-medium transition transform hover:scale-[1.02]"
              >
                View sample summary
              </Link>
            </div>
          </div>

          {/* App preview mockups */}
          <div className="mt-10">
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 shadow-2xl">
              {/* subtle inner glow */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: 'inset 0 1px 12px rgba(255,255,255,.06)' }}
              />

              {/* 3-up responsive mockups */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Dashboard / Hub mockup */}
                <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden transition transform hover:-translate-y-1 hover:shadow-2xl">
                  <div className="aspect-[16/10] bg-[url('/mockups/hub.png')] bg-cover bg-center transition-transform duration-500 hover:scale-[1.02]" />
                  <div className="p-3 text-xs opacity-80">Hub (manage games &amp; sharing)</div>
                </div>

                {/* Live viewer mockup */}
                <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden transition transform hover:-translate-y-1 hover:shadow-2xl">
                  <div className="aspect-[16/10] bg-[url('/mockups/live-viewer.png')] bg-cover bg-center transition-transform duration-500 hover:scale-[1.02]" />
                  <div className="p-3 text-xs opacity-80">Live viewer (read‑only link)</div>
                </div>

                {/* Mobile game UI mockup */}
                <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden transition transform hover:-translate-y-1 hover:shadow-2xl">
                  <div className="aspect-[9/16] md:aspect-[10/16] mx-auto w-full bg-[url('/mockups/mobile-game.png')] bg-cover bg-top transition-transform duration-500 hover:scale-[1.02]" />
                  <div className="p-3 text-xs opacity-80">In‑game logging (mobile)</div>
                </div>
              </div>

              {/* helper notes for assets */}
              {/* Drop PNG/JPG files into /public/mockups with names:
                  - hub.png
                  - live-viewer.png
                  - mobile-game.png
                  - summary.png
                 They will be picked up automatically. */}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <h2 className="text-2xl md:text-3xl font-bold">Built for game day</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Feature
              title="One-tap stat logging"
              text="Large, color-coded tiles with ripple feedback. K/HB flow captures contested & effectiveness without slowing you down."
              icon={<BoltIcon/>}
            />
            <Feature
              title="Single or both teams"
              text="Track your team only or mirror the UI to capture opponent quick stats alongside."
              icon={<SparkleIcon/>}
            />
            <Feature
              title="Squad & presets"
              text="Load a full squad once, then auto-populate new games. Edit numbers and names mid-game if needed."
              icon={<UsersIcon/>}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <h2 className="text-2xl md:text-3xl font-bold">How it works</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-3 text-sm opacity-90">
            <li className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold mb-1">1. Create a game</p>
              <p>Set opponent, date, and venue. Optionally load your saved squad.</p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold mb-1">2. Tap to record</p>
              <p>Select a player → choose stat → add possession & effectiveness. Undo stays one tap away.</p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold mb-1">3. Share live</p>
              <p>Toggle “Share live” to generate a read-only link for staff, supporters, or big-screen displays.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* HOW IT LOOKS - Carousel */}
      <section id="gallery" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl md:text-3xl font-bold">How it looks</h2>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={prev} aria-label="Previous" className="rounded-md border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5">
                ←
              </button>
              <button onClick={next} aria-label="Next" className="rounded-md border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5">
                →
              </button>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {/* Slide track */}
            <div
              className="whitespace-nowrap transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${idx * 100}%)` }}
            >
              {gallery.map((g, i) => (
                <div key={i} className="inline-block align-top w-full">
                  <div className="aspect-[16/9] md:aspect-[21/9] bg-slate-900/50 transition-transform duration-500 hover:scale-[1.01]">
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${g.src}')` }}
                      role="img"
                      aria-label={g.caption}
                    />
                  </div>
                  <div className="px-4 py-3 text-sm opacity-85 border-t border-white/10">
                    {g.caption}
                  </div>
                </div>
              ))}
            </div>

            {/* Prev/Next overlay buttons (mobile visible) */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 md:hidden">
              <button onClick={prev} aria-label="Previous" className="rounded-md border border-white/20 bg-black/30 backdrop-blur px-3 py-2">←</button>
              <button onClick={next} aria-label="Next" className="rounded-md border border-white/20 bg-black/30 backdrop-blur px-3 py-2">→</button>
            </div>
          </div>

          {/* Dots */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${i === idx ? 'w-6 bg-emerald-400' : 'w-2.5 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Pricing</h2>
          <div className="flex items-center justify-center mb-8 space-x-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md font-semibold ${billingCycle === 'monthly' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md font-semibold ${billingCycle === 'yearly' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              Yearly
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <PricingCard
              title="Single Player"
              price={billingCycle === 'monthly' ? '$9' : '$90'}
              period={billingCycle === 'monthly' ? 'month' : 'year'}
              features={[
                'Basic stat logging',
                'Access to live viewer',
                'Mobile app support',
              ]}
              link="/register?plan=single"
              highlight={false}
            />
            <PricingCard
              title="Team"
              price={billingCycle === 'monthly' ? '$29' : '$290'}
              period={billingCycle === 'monthly' ? 'month' : 'year'}
              features={[
                'All Single Player features',
                'Multiple users & squads',
                'Advanced analytics',
                'Priority support',
              ]}
              link="/register?plan=team"
              highlight={true}
            />
            <PricingCard
              title="Full Package"
              price={billingCycle === 'monthly' ? '$49' : '$490'}
              period={billingCycle === 'monthly' ? 'month' : 'year'}
              features={[
                'All Team features',
                'Custom integrations',
                'Dedicated account manager',
                'Early access to new features',
              ]}
              link="/register?plan=full"
              highlight={false}
            />
          </div>
        </div>
      </section>

      {/* SHARE */}
      <section id="share" className="relative z-10 border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold">Live viewer, zero setup</h3>
                <p className="mt-2 text-sm opacity-90">
                  Flip one switch to broadcast scores and key stats. Your audience gets a clean,
                  mobile-friendly page that updates in real time.
                </p>
              </div>
              <div className="flex gap-3">
                <Link to={authLink('/new')} className="px-4 py-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/20">
                  Try it now
                </Link>
                <Link to="/summary/demo" className="px-4 py-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/20">
                  See a demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS & CLUBS */}
      <section id="testimonials" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          {/* Club logos band */}
          <div className="mb-8">
            <p className="text-center text-xs uppercase tracking-wide text-white/60 mb-4">Trusted by community clubs</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center">
              {/* Drop logo PNGs into /public/logos and update srcs as you get real clubs */}
              <img src="/logos/club1.png" alt="Club 1" className="mx-auto h-10 opacity-70 hover:opacity-100 transition" />
              <img src="/logos/club2.png" alt="Club 2" className="mx-auto h-10 opacity-70 hover:opacity-100 transition" />
              <img src="/logos/club3.png" alt="Club 3" className="mx-auto h-10 opacity-70 hover:opacity-100 transition" />
              <img src="/logos/club4.png" alt="Club 4" className="mx-auto h-10 opacity-70 hover:opacity-100 transition" />
              <img src="/logos/club5.png" alt="Club 5" className="mx-auto h-10 opacity-70 hover:opacity-100 transition" />
              <img src="/logos/club6.png" alt="Club 6" className="mx-auto h-10 opacity-70 hover:opacity-100 transition" />
            </div>
          </div>

          {/* Testimonials cards */}
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Coaches & managers love it</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Testimonial
              quote="Kickchasers cut our match-day admin in half. The live link kept parents and committee glued to the action."
              name="Sam R."
              role="Senior Coach, Bayside Roos"
            />
            <Testimonial
              quote="It’s the first app our volunteers didn’t need a manual for. One tap and the numbers just flow."
              name="Kelly M."
              role="Team Manager, West Valley FC"
            />
            <Testimonial
              quote="Post-game summary made our reviews sharp and fast. Exported the PDF straight into our notes."
              name="Alex P."
              role="High Performance, North Lakes"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-8 text-xs opacity-70 flex items-center justify-between">
          <div>© {new Date().getFullYear()} Kickchasers</div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:opacity-100 transition hover:text-white hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.45)]">Features</a>
            <a href="#how" className="hover:opacity-100 transition hover:text-white hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.45)]">How it works</a>
            <Link to={authLink('/hub')} className="hover:opacity-100 transition hover:text-white hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.45)]">Open app</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({
  title,
  text,
  icon,
}: { title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="h-9 w-9 rounded-lg border border-white/15 bg-white/10 grid place-items-center mb-3">
        {icon}
      </div>
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm opacity-80">{text}</p>
    </div>
  )
}

function PricingCard({
  title,
  price,
  period,
  features,
  link,
  highlight,
}: {
  title: string
  price: string
  period: string
  features: string[]
  link: string
  highlight: boolean
}) {
  return (
    <div className={`rounded-xl border p-6 flex flex-col justify-between ${highlight ? 'border-emerald-400 bg-emerald-900/30' : 'border-white/10 bg-white/5'}`}>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="text-3xl font-bold mb-4">
        {price} <span className="text-lg font-normal text-white/80">/ {period}</span>
      </div>
      <ul className="mb-6 space-y-2 text-sm opacity-90">
        {features.map((feature, i) => (
          <li key={i} className="before:content-['✓'] before:text-emerald-400 before:mr-2">
            {feature}
          </li>
        ))}
      </ul>
      <Link
        to={link}
        className={`mt-auto px-4 py-2 rounded-md text-center font-semibold ${highlight ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
      >
        Sign up
      </Link>
    </div>
  )
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col">
      <p className="text-sm opacity-90">“{quote}”</p>
      <div className="mt-4 pt-4 border-t border-white/10 text-sm">
        <div className="font-semibold">{name}</div>
        <div className="opacity-70">{role}</div>
      </div>
    </div>
  )
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M12 3l2.5 5L20 11.5 15 14l-2.5 5L10 14 4 11.5 9.5 8 12 3z" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-90">
      <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM20 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}